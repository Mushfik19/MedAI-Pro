"""Resource-oriented portal endpoints backed by the clinical domain."""

from __future__ import annotations

import asyncio
import csv
import io
import json
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from pathlib import Path
from typing import Annotated
from uuid import NAMESPACE_URL, UUID, uuid5

import pandas as pd
from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.responses import FileResponse, Response
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from mediai.core.enums import AuditOutcome, UserRole, UserStatus
from mediai.features.auth.dependencies import CurrentUser
from mediai.features.auth.models import AuditLog, RefreshSession, User
from mediai.features.clinical.service import ClinicalService
from mediai.infrastructure.database.clinical_models import (
    LLMConversation,
    PredictionRecord,
    ReportArtifact,
    UserPreference,
)
from mediai.infrastructure.database.dependencies import get_database_session
from mediai.infrastructure.ml.dataset import clean_training_frame
from mediai.shared.domain.exceptions import AuthorizationError

router = APIRouter(tags=["Portal"])
DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]


async def _doctor_user(user: CurrentUser) -> User:
    if user.role.name not in {UserRole.DOCTOR, UserRole.ADMIN}:
        raise AuthorizationError()
    return user


async def _admin_user(user: CurrentUser) -> User:
    if user.role.name is not UserRole.ADMIN:
        raise AuthorizationError()
    return user


DoctorUser = Annotated[User, Depends(_doctor_user)]
AdminUser = Annotated[User, Depends(_admin_user)]

_NORMAL_INPUTS: dict[str, float] = {
    "age": 30,
    "fever_celsius": 37,
    "oxygen_saturation": 98,
    "systolic_bp": 120,
    "diastolic_bp": 80,
    "heart_rate": 75,
    "respiratory_rate": 16,
    "glucose_mg_dl": 95,
    "wbc_count": 7,
    "platelets_count": 250,
}


def _meta(request: Request, **extra: object) -> dict[str, object]:
    return {"request_id": request.state.request_id, **extra}


def _confidence_band(value: float) -> str:
    return "HIGH" if value >= 0.75 else "MEDIUM" if value >= 0.5 else "LOW"


def _history_record(record: PredictionRecord) -> dict[str, object]:
    symptoms = [
        key.replace("_", " ").title()
        for key, value in record.input_payload.items()
        if key != "symptom_duration_days"
        and isinstance(value, (int, float))
        and value > 0
    ][:8]
    return {
        "id": record.id,
        "created_at": record.created_at,
        "top_candidate": {
            "name": record.predicted_disease_name,
            "probability": record.probability,
            "severity": record.disease_severity.value,
        },
        "confidence_band": _confidence_band(record.confidence),
        "review_status": "PATIENT_ONLY",
        "symptoms": symptoms,
    }


def _ranked_candidates(items: list[dict[str, object]]) -> list[dict[str, object]]:
    return [
        {
            "rank": rank,
            "disease": {
                "id": uuid5(NAMESPACE_URL, f"mediai:disease:{candidate['code']}"),
                "code": candidate["code"],
                "name": candidate["name"],
            },
            "probability": candidate["probability"],
            "severity": candidate["severity"],
            "supporting_symptoms": [],
            "missing_discriminative_symptoms": [],
            "recommended_tests": [],
            "specialist": {
                "code": str(candidate["specialty"]).lower().replace(" ", "-"),
                "name": candidate["specialty"],
            },
        }
        for rank, candidate in enumerate(items[:5], start=1)
    ]


def _clinical_service(request: Request, session: AsyncSession) -> ClinicalService:
    return ClinicalService(
        session=session,
        settings=request.app.state.settings,
        model_service=request.app.state.ml_service,
        llm_service=request.app.state.llm_service,
    )


async def _preference(session: AsyncSession, user: User) -> UserPreference:
    preference = await session.get(UserPreference, user.id)
    if preference is None:
        preference = UserPreference(
            user_id=user.id,
            language="en",
            timezone=user.profile.timezone,
            email_notifications=True,
            dashboard_preferences={"theme": "system", "profile": {}},
            notification_filters={
                "clinical_alerts": True,
                "product_updates": False,
                "report_ready": True,
                "weekly_digest": True,
            },
        )
        session.add(preference)
        await session.flush()
    return preference


@router.get("/catalog/symptoms")
async def symptoms(
    request: Request,
    _user: CurrentUser,
    search: str | None = Query(default=None),
) -> dict[str, object]:
    term = (search or "").casefold()
    items = []
    for position, feature in enumerate(request.app.state.ml_service.feature_names()):
        name = feature.replace("_", " ").title()
        if term and term not in name.casefold() and term not in feature.casefold():
            continue
        items.append(
            {
                "id": uuid5(NAMESPACE_URL, f"mediai:symptom:{feature}"),
                "code": feature,
                "name": name,
                "category": "Clinical feature",
                "position": position,
            }
        )
    return {"data": items, "meta": _meta(request)}


@router.post("/predictions", status_code=201)
async def create_prediction(
    payload: dict[str, object],
    request: Request,
    user: CurrentUser,
    session: DatabaseSession,
) -> dict[str, object]:
    model_features = request.app.state.ml_service.feature_names()
    values = {feature: _NORMAL_INPUTS.get(feature, 0.0) for feature in model_features}
    durations: list[float] = []
    symptom_by_id = {
        str(uuid5(NAMESPACE_URL, f"mediai:symptom:{feature}")): feature
        for feature in model_features
    }
    for item in payload.get("symptoms", []):
        if not isinstance(item, dict):
            continue
        feature = symptom_by_id.get(str(item.get("symptom_id")))
        if feature is None:
            continue
        intensity = float(item.get("intensity", 1))
        values[feature] = (
            min(1.0, intensity / 5.0)
            if feature in {"travel_exposure", "contact_exposure", "weight_loss", "neck_stiffness", "photophobia"}
            else min(3.0, intensity * 0.6)
        )
        durations.append(float(item.get("duration_days", 1)))
    values["symptom_duration_days"] = max(durations, default=1)
    result = await _clinical_service(request, session).predict(
        values, request.state.request_id, user.id
    )
    record = result["prediction"]
    model_result = result["model_result"]
    bundle = request.app.state.ml_service.bundle
    candidates = _ranked_candidates(model_result["top_diseases"])
    severity = str(model_result["severity"])
    emergency = severity == "CRITICAL"
    return {
        "data": {
            "id": record.id,
            "status": "COMPLETED",
            "created_at": record.created_at,
            "model": {
                "version": model_result["model_version"],
                "trained_at": bundle.trained_at if bundle else datetime.now(UTC),
            },
            "confidence": {
                "score": model_result["confidence"],
                "band": _confidence_band(float(model_result["confidence"])),
                "label": f"{_confidence_band(float(model_result['confidence'])).title()} confidence",
            },
            "emergency": {
                "is_emergency": emergency,
                "action_level": "EMERGENCY" if emergency else "URGENT" if severity == "HIGH" else "ROUTINE",
                "message": "Seek urgent medical evaluation." if emergency else None,
                "matched_rule_codes": ["CRITICAL_SEVERITY"] if emergency else [],
            },
            "results": candidates,
            "explanation": result["llm"].medical_summary,
            "disclaimer": "This assessment supports, but does not replace, evaluation by a qualified clinician.",
        },
        "meta": _meta(request),
    }


@router.get("/predictions/{prediction_id}")
async def get_prediction_assessment(
    prediction_id: UUID,
    request: Request,
    user: CurrentUser,
    session: DatabaseSession,
) -> dict[str, object]:
    record = await session.get(PredictionRecord, prediction_id)
    if record is None or record.user_id != user.id:
        raise HTTPException(status_code=404, detail="Assessment report not found")
    bundle = request.app.state.ml_service.bundle
    severity = record.disease_severity.value
    selected_symptoms = [
        {
            "id": uuid5(NAMESPACE_URL, f"mediai:symptom:{feature}"),
            "code": feature,
            "name": feature.replace("_", " ").title(),
            "intensity": float(value),
        }
        for feature, value in record.input_payload.items()
        if feature != "symptom_duration_days"
        and isinstance(value, (int, float))
        and value > 0
    ]
    emergency = severity == "CRITICAL"
    return {
        "data": {
            "assessment": {
                "id": record.id,
                "status": "COMPLETED",
                "created_at": record.created_at,
                "model": {
                    "version": record.model_version,
                    "trained_at": bundle.trained_at if bundle else record.created_at,
                },
                "confidence": {
                    "score": record.confidence,
                    "band": _confidence_band(record.confidence),
                    "label": (
                        f"{_confidence_band(record.confidence).title()} confidence"
                    ),
                },
                "emergency": {
                    "is_emergency": emergency,
                    "action_level": "EMERGENCY" if emergency else "ROUTINE",
                    "message": "Seek urgent medical evaluation." if emergency else None,
                    "matched_rule_codes": ["CRITICAL_SEVERITY"] if emergency else [],
                },
                "results": _ranked_candidates(record.top_diseases),
                "explanation": record.llm_summary,
                "disclaimer": (
                    "This assessment supports, but does not replace, evaluation "
                    "by a qualified clinician."
                ),
            },
            "selected_symptoms": selected_symptoms,
        },
        "meta": _meta(request),
    }


@router.get("/predictions")
async def prediction_history(
    request: Request,
    user: CurrentUser,
    session: DatabaseSession,
    query: str | None = Query(default=None),
) -> dict[str, object]:
    records, _ = await _clinical_service(request, session).list_history(
        limit=100, offset=0, user_id=user.id, query=query
    )
    return {
        "data": [_history_record(record) for record in records],
        "meta": _meta(request, next_cursor=None, has_more=False),
    }


@router.get("/dashboard/summary")
async def dashboard_summary(
    request: Request, user: CurrentUser, session: DatabaseSession
) -> dict[str, object]:
    records, total = await _clinical_service(request, session).list_history(
        limit=10, offset=0, user_id=user.id
    )
    average = sum(record.confidence for record in records) / len(records) if records else 0
    return {
        "data": {
            "total_predictions": total,
            "average_confidence": average,
            "recent_activity_count": len(records),
            "red_flag_count": sum(record.disease_severity.value in {"HIGH", "CRITICAL"} for record in records),
            "monthly_prediction_delta": 0,
            "confidence_delta": 0,
            "recent_predictions": [_history_record(record) for record in records],
        },
        "meta": _meta(request),
    }


@router.get("/dashboard/trends")
async def dashboard_trends(
    request: Request, user: CurrentUser, session: DatabaseSession
) -> dict[str, object]:
    since = datetime.now(UTC) - timedelta(days=7)
    rows = (
        await session.execute(
            select(
                func.date(PredictionRecord.created_at),
                func.count(PredictionRecord.id),
                func.avg(PredictionRecord.confidence),
            )
            .where(PredictionRecord.user_id == user.id, PredictionRecord.created_at >= since)
            .group_by(func.date(PredictionRecord.created_at))
            .order_by(func.date(PredictionRecord.created_at))
        )
    ).all()
    return {
        "data": {
            "generated_at": datetime.now(UTC),
            "points": [
                {"label": str(day), "predictions": count, "confidence": float(confidence)}
                for day, count, confidence in rows
            ],
        },
        "meta": _meta(request),
    }


@router.get("/dashboard/disease-frequency")
async def disease_frequency(
    request: Request, user: CurrentUser, session: DatabaseSession
) -> dict[str, object]:
    rows = (
        await session.execute(
            select(PredictionRecord.predicted_disease_code, PredictionRecord.predicted_disease_name, func.count())
            .where(PredictionRecord.user_id == user.id)
            .group_by(PredictionRecord.predicted_disease_code, PredictionRecord.predicted_disease_name)
        )
    ).all()
    total = sum(count for _, _, count in rows)
    return {
        "data": {
            "generated_at": datetime.now(UTC),
            "items": [
                {
                    "disease_id": uuid5(NAMESPACE_URL, f"mediai:disease:{code}"),
                    "name": name,
                    "percentage": (count / total * 100) if total else 0,
                }
                for code, name, count in rows
            ],
        },
        "meta": _meta(request),
    }


@router.get("/dashboard/reports/weekly")
async def weekly_report(
    request: Request, user: CurrentUser, session: DatabaseSession
) -> dict[str, object]:
    count = int(
        await session.scalar(
            select(func.count()).select_from(PredictionRecord).where(
                PredictionRecord.user_id == user.id,
                PredictionRecord.created_at >= datetime.now(UTC) - timedelta(days=7),
            )
        )
        or 0
    )
    return {
        "data": {
            "period_label": "Last 7 days",
            "prediction_count": count,
            "doctor_review_count": 0,
            "report_id": None,
            "status": "UNAVAILABLE",
        },
        "meta": _meta(request),
    }


@router.get("/users/me")
async def profile(request: Request, user: CurrentUser, session: DatabaseSession) -> dict[str, object]:
    preference = await _preference(session, user)
    stored = preference.dashboard_preferences.get("profile", {})
    names = user.profile.display_name.split(maxsplit=1)
    return {
        "data": {
            "user_id": user.id,
            "email": user.email,
            "first_name": stored.get("first_name", names[0]),
            "last_name": stored.get("last_name", names[1] if len(names) > 1 else "User"),
            "phone": stored.get("phone", "00000000"),
            "city": stored.get("city", "Not provided"),
            "date_of_birth": stored.get("date_of_birth", "1990-01-01"),
            "sex_at_birth": stored.get("sex_at_birth", "PREFER_NOT_TO_SAY"),
            "timezone": user.profile.timezone,
            "identity_verified": True,
        },
        "meta": _meta(request),
    }


@router.patch("/users/me/profile")
async def update_profile(
    request: Request,
    user: CurrentUser,
    session: DatabaseSession,
    payload: dict[str, object] = Body(...),
) -> dict[str, object]:
    preference = await _preference(session, user)
    profile_data = dict(preference.dashboard_preferences.get("profile", {}))
    profile_data.update(payload)
    preference.dashboard_preferences = {
        **preference.dashboard_preferences,
        "profile": profile_data,
    }
    user.profile.display_name = f"{payload.get('first_name', '')} {payload.get('last_name', '')}".strip()
    user.profile.timezone = str(payload.get("timezone", user.profile.timezone))
    await session.commit()
    return await profile(request, user, session)


@router.get("/users/me/settings")
async def user_settings(
    request: Request, user: CurrentUser, session: DatabaseSession
) -> dict[str, object]:
    preference = await _preference(session, user)
    return {
        "data": {
            "theme": preference.dashboard_preferences.get("theme", "system"),
            "notifications": {
                "clinical_alerts": preference.notification_filters.get("clinical_alerts", True),
                "product_updates": preference.notification_filters.get("product_updates", False),
                "report_ready": preference.notification_filters.get("report_ready", True),
                "weekly_digest": preference.notification_filters.get("weekly_digest", True),
            },
            "mfa_enabled": False,
        },
        "meta": _meta(request),
    }


@router.patch("/users/me/settings")
async def update_settings(
    request: Request,
    user: CurrentUser,
    session: DatabaseSession,
    payload: dict[str, object] = Body(...),
) -> dict[str, object]:
    preference = await _preference(session, user)
    if "theme" in payload:
        preference.dashboard_preferences = {
            **preference.dashboard_preferences,
            "theme": payload["theme"],
        }
    if isinstance(payload.get("notifications"), dict):
        preference.notification_filters = dict(payload["notifications"])
    await session.commit()
    return await user_settings(request, user, session)


@router.get("/auth/sessions")
async def sessions(
    request: Request, user: CurrentUser, session: DatabaseSession
) -> dict[str, object]:
    items = (
        await session.scalars(
            select(RefreshSession)
            .where(RefreshSession.user_id == user.id, RefreshSession.revoked_at.is_(None))
            .order_by(RefreshSession.created_at.desc())
        )
    ).all()
    principal = request.state.principal
    return {
        "data": [
            {
                "id": item.id,
                "device_name": item.user_agent or "Unknown device",
                "location_label": None,
                "last_seen_at": item.last_used_at or item.created_at,
                "is_current": item.id == principal.session_id,
            }
            for item in items
        ],
        "meta": _meta(request),
    }


@router.post("/users/me/data-export")
async def export_data(
    user: CurrentUser, session: DatabaseSession
) -> Response:
    records = (
        await session.scalars(
            select(PredictionRecord)
            .where(PredictionRecord.user_id == user.id)
            .order_by(PredictionRecord.created_at.desc())
        )
    ).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "created_at", "disease", "severity", "probability", "confidence"])
    writer.writerows(
        [
            record.id,
            record.created_at.isoformat(),
            record.predicted_disease_name,
            record.disease_severity.value,
            record.probability,
            record.confidence,
        ]
        for record in records
    )
    return Response(
        output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": 'attachment; filename="mediai-export.csv"'},
    )


@router.post("/users/me/deletion-request", status_code=202)
async def request_deletion(
    request: Request, user: CurrentUser, session: DatabaseSession
) -> dict[str, object]:
    session.add(
        AuditLog(
            actor_id=user.id,
            action="account.deletion_requested",
            resource_type="user",
            resource_id=user.id,
            outcome=AuditOutcome.SUCCESS,
            request_id=request.state.request_id,
            ip_hash=None,
            user_agent=request.headers.get("user-agent"),
            changes={},
            created_at=datetime.now(UTC),
        )
    )
    await session.commit()
    return {"data": {"accepted": True}, "meta": _meta(request)}


@router.get("/predictions/{prediction_id}/report")
async def prediction_report(
    prediction_id: UUID,
    request: Request,
    user: CurrentUser,
    session: DatabaseSession,
) -> dict[str, object]:
    prediction = await session.get(PredictionRecord, prediction_id)
    if prediction is None or prediction.user_id != user.id:
        raise HTTPException(status_code=404, detail="Prediction not found")
    artifact = await _clinical_service(request, session).generate_report(prediction_id, user.id)
    return {
        "data": {
            "status": "READY",
            "download_url": str(
                request.url_for("download_prediction_report", report_id=str(artifact.id))
            ),
        },
        "meta": _meta(request),
    }


@router.get("/predictions/reports/{report_id}/download")
async def download_prediction_report(
    report_id: UUID, user: CurrentUser, session: DatabaseSession
) -> FileResponse:
    artifact = await session.get(ReportArtifact, report_id)
    if artifact is None or artifact.user_id != user.id:
        raise HTTPException(status_code=404, detail="Report not found")
    path = Path(artifact.file_path)
    if not path.is_file():
        raise HTTPException(status_code=404, detail="Report file not found")
    return FileResponse(path, media_type=artifact.mime_type, filename=artifact.file_name)


def _conversation_summary(item: LLMConversation) -> dict[str, object]:
    return {
        "id": item.id,
        "title": item.prompt[:60] if item.prompt else "New conversation",
        "updated_at": item.updated_at,
        "message_count": int(bool(item.prompt)) + int(bool(item.response)),
        "prediction_id": item.context_payload.get("prediction_id"),
    }


@router.get("/chat/conversations")
async def conversations(
    request: Request, user: CurrentUser, session: DatabaseSession
) -> dict[str, object]:
    items = (
        await session.scalars(
            select(LLMConversation)
            .where(LLMConversation.user_id == user.id)
            .order_by(LLMConversation.updated_at.desc())
        )
    ).all()
    return {"data": [_conversation_summary(item) for item in items], "meta": _meta(request)}


@router.post("/chat/conversations", status_code=201)
async def create_conversation(
    request: Request, user: CurrentUser, session: DatabaseSession
) -> dict[str, object]:
    latest = await session.scalar(
        select(PredictionRecord)
        .where(PredictionRecord.user_id == user.id)
        .order_by(PredictionRecord.created_at.desc())
        .limit(1)
    )
    context_payload = (
        {
            "prediction_id": str(latest.id),
            "disease_name": latest.predicted_disease_name,
            "severity": latest.disease_severity.value,
            "confidence": latest.confidence,
            "top_diseases": latest.top_diseases,
        }
        if latest
        else {}
    )
    item = LLMConversation(
        user_id=user.id,
        request_id=request.state.request_id,
        prompt="",
        response="",
        model_name=request.app.state.settings.llm_model,
        provider=request.app.state.llm_service.provider.value,
        context_payload=context_payload,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return {"data": _conversation_summary(item), "meta": _meta(request)}


@router.get("/chat/conversations/{conversation_id}")
async def conversation(
    conversation_id: UUID,
    request: Request,
    user: CurrentUser,
    session: DatabaseSession,
) -> dict[str, object]:
    item = await session.get(LLMConversation, conversation_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    messages = []
    if item.prompt:
        messages.append(
            {
                "id": uuid5(NAMESPACE_URL, f"{item.id}:user"),
                "role": "USER",
                "content": item.prompt,
                "created_at": item.created_at,
                "safety_flags": [],
                "grounding_references": [],
            }
        )
    if item.response:
        messages.append(
            {
                "id": uuid5(NAMESPACE_URL, f"{item.id}:assistant"),
                "role": "ASSISTANT",
                "content": item.response,
                "created_at": item.updated_at,
                "safety_flags": [],
                "grounding_references": [],
            }
        )
    return {
        "data": {
            "id": item.id,
            "title": item.prompt[:60] if item.prompt else "New conversation",
            "prediction_id": item.context_payload.get("prediction_id"),
            "messages": messages,
        },
        "meta": _meta(request),
    }


@router.post("/chat/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: UUID,
    payload: dict[str, object],
    request: Request,
    user: CurrentUser,
    session: DatabaseSession,
) -> Response:
    item = await session.get(LLMConversation, conversation_id)
    if item is None or item.user_id != user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")
    content = str(payload.get("content", "")).strip()
    if not content:
        raise HTTPException(status_code=422, detail="Message cannot be empty")
    answer = await request.app.state.llm_service.answer_chat(
        user_message=content,
        context={"user_id": str(user.id), **item.context_payload},
    )
    item.prompt = content
    item.response = answer
    await session.commit()
    message_id = uuid5(NAMESPACE_URL, f"{item.id}:assistant")
    stream = (
        "event: message.completed\n"
        f'data: {{"message_id":"{message_id}","safety_flags":[],"grounding_references":[]}}\n\n'
    )
    return Response(stream, media_type="text/event-stream")


@router.get("/doctor/dashboard")
async def doctor_dashboard(
    request: Request, _user: DoctorUser, session: DatabaseSession
) -> dict[str, object]:
    total = int(await session.scalar(select(func.count()).select_from(PredictionRecord)) or 0)
    today = datetime.now(UTC).date()
    reviewed_today = int(
        await session.scalar(
            select(func.count()).select_from(AuditLog).where(
                AuditLog.action == "doctor.note_created",
                func.date(AuditLog.created_at) == today,
            )
        )
        or 0
    )
    return {
        "data": {
            "assigned_patients": total,
            "new_patients_this_week": total,
            "pending_reviews": total,
            "due_today": total,
            "safety_alerts": 0,
            "reviewed_today": reviewed_today,
            "median_review_minutes": 0,
            "review_activity": [{"label": "Today", "reviews": reviewed_today}],
        },
        "meta": _meta(request),
    }


@router.get("/doctor/patients")
async def doctor_patients(
    request: Request,
    _user: DoctorUser,
    session: DatabaseSession,
    query: str | None = Query(default=None),
) -> dict[str, object]:
    statement = (
        select(PredictionRecord, User)
        .join(User, User.id == PredictionRecord.user_id)
        .order_by(PredictionRecord.created_at.desc())
        .limit(100)
    )
    if query:
        statement = statement.where(User.email.ilike(f"%{query}%"))
    rows = (await session.execute(statement)).all()
    seen: set[UUID] = set()
    items = []
    for prediction, patient in rows:
        if patient.id in seen:
            continue
        seen.add(patient.id)
        items.append(
            {
                "id": patient.id,
                "display_name": patient.profile.display_name,
                "age_years": int(prediction.input_payload.get("age", 0)),
                "latest_prediction": {
                    "id": prediction.id,
                    "top_candidate_name": prediction.predicted_disease_name,
                    "confidence": prediction.confidence,
                },
                "priority": (
                    "RED_FLAG"
                    if prediction.disease_severity.value in {"HIGH", "CRITICAL"}
                    else "ROUTINE"
                ),
                "review_status": "NEW",
            }
        )
    return {"data": items, "meta": _meta(request, next_cursor=None, has_more=False)}


@router.post("/doctor/predictions/{prediction_id}/notes", status_code=201)
async def doctor_note(
    prediction_id: UUID,
    payload: dict[str, object],
    request: Request,
    user: DoctorUser,
    session: DatabaseSession,
) -> dict[str, object]:
    if await session.get(PredictionRecord, prediction_id) is None:
        raise HTTPException(status_code=404, detail="Prediction not found")
    session.add(
        AuditLog(
            actor_id=user.id,
            action="doctor.note_created",
            resource_type="prediction_record",
            resource_id=prediction_id,
            outcome=AuditOutcome.SUCCESS,
            request_id=request.state.request_id,
            ip_hash=None,
            user_agent=request.headers.get("user-agent"),
            changes={"content": str(payload.get("content", ""))[:2000]},
            created_at=datetime.now(UTC),
        )
    )
    await session.commit()
    return {"data": {"created": True}, "meta": _meta(request)}


@router.post("/doctor/reports/{prediction_id}", status_code=202)
async def doctor_report(
    prediction_id: UUID,
    request: Request,
    user: DoctorUser,
    session: DatabaseSession,
) -> dict[str, object]:
    await _clinical_service(request, session).generate_report(prediction_id, user.id)
    return {"data": {"accepted": True}, "meta": _meta(request)}


@router.get("/admin/analytics/summary")
async def admin_analytics(
    request: Request, _user: AdminUser, session: DatabaseSession
) -> dict[str, object]:
    now = datetime.now(UTC)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)
    total_users = int(await session.scalar(select(func.count()).select_from(User)) or 0)
    active_users = int(
        await session.scalar(
            select(func.count()).select_from(User).where(User.status == UserStatus.ACTIVE)
        )
        or 0
    )
    new_registrations = int(
        await session.scalar(
            select(func.count()).select_from(User).where(User.created_at >= seven_days_ago)
        )
        or 0
    )
    total_predictions = int(
        await session.scalar(select(func.count()).select_from(PredictionRecord)) or 0
    )
    predictions_today = int(
        await session.scalar(
            select(func.count()).select_from(PredictionRecord).where(
                func.date(PredictionRecord.created_at) == now.date()
            )
        )
        or 0
    )
    total_chats = int(
        await session.scalar(select(func.count()).select_from(LLMConversation)) or 0
    )
    registrations = (
        await session.execute(
            select(func.date(User.created_at), func.count())
            .where(User.created_at >= thirty_days_ago)
            .group_by(func.date(User.created_at))
            .order_by(func.date(User.created_at))
        )
    ).all()
    assessments = (
        await session.execute(
            select(func.date(PredictionRecord.created_at), func.count())
            .where(PredictionRecord.created_at >= thirty_days_ago)
            .group_by(func.date(PredictionRecord.created_at))
            .order_by(func.date(PredictionRecord.created_at))
        )
    ).all()
    diseases = (
        await session.execute(
            select(PredictionRecord.predicted_disease_name, func.count())
            .group_by(PredictionRecord.predicted_disease_name)
            .order_by(func.count().desc())
            .limit(10)
        )
    ).all()
    symptom_counts: dict[str, int] = {}
    inputs = (
        await session.scalars(
            select(PredictionRecord.input_payload).order_by(
                PredictionRecord.created_at.desc()
            )
        )
    ).all()
    for payload in inputs:
        for symptom, value in payload.items():
            if (
                symptom != "symptom_duration_days"
                and isinstance(value, (int, float))
                and value > 0
            ):
                symptom_counts[symptom] = symptom_counts.get(symptom, 0) + 1
    bundle = request.app.state.ml_service.bundle
    top5 = float(bundle.metrics.get("top_5_accuracy", 0)) if bundle else 0
    return {
        "data": {
            "total_users": total_users,
            "active_users": active_users,
            "new_registrations": new_registrations,
            "total_assessments": total_predictions,
            "total_predictions": total_predictions,
            "total_ai_chats": total_chats,
            "user_growth_rate": 0,
            "predictions_today": predictions_today,
            "prediction_growth_rate": 0,
            "model_top5_recall": top5,
            "open_incidents": 0,
            "registrations": [
                {"date": str(date), "count": count} for date, count in registrations
            ],
            "assessment_trends": [
                {"date": str(date), "count": count} for date, count in assessments
            ],
            "disease_distribution": [
                {"name": name, "count": count} for name, count in diseases
            ],
            "symptom_frequency": [
                {"name": name.replace("_", " ").title(), "count": count}
                for name, count in sorted(
                    symptom_counts.items(), key=lambda item: item[1], reverse=True
                )[:10]
            ],
            "model_performance": [
                {"label": "Active model", "top5_recall": top5, "calibration_score": 0}
            ],
        },
        "meta": _meta(request),
    }


@router.get("/admin/users")
async def admin_users(
    request: Request,
    _user: AdminUser,
    session: DatabaseSession,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    search: Annotated[str, Query(max_length=120)] = "",
    role: UserRole | None = None,
    status: UserStatus | None = None,
) -> dict[str, object]:
    statement = select(User)
    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                User.email.ilike(pattern),
                User.username.ilike(pattern),
            )
        )
    if role is not None:
        statement = statement.where(User.role.has(name=role))
    if status is not None:
        statement = statement.where(User.status == status)
    users = (
        await session.scalars(statement.order_by(User.created_at.desc()).limit(limit))
    ).unique().all()
    return {
        "data": [
            {
                "id": item.id,
                "username": item.username,
                "email": item.email,
                "display_name": item.profile.display_name,
                "role": item.role.name.value,
                "status": item.status.value,
                "created_at": item.created_at,
                "last_login_at": item.last_login_at,
            }
            for item in users
        ],
        "meta": _meta(request, next_cursor=None, has_more=False),
    }


@router.patch("/admin/users/{user_id}")
async def admin_update_user(
    user_id: UUID,
    payload: dict[str, object],
    request: Request,
    admin: AdminUser,
    session: DatabaseSession,
) -> dict[str, object]:
    target = await session.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == admin.id or target.role.name is UserRole.ADMIN:
        raise HTTPException(status_code=409, detail="Administrator accounts cannot be disabled")
    requested = str(payload.get("status", ""))
    if requested not in {UserStatus.ACTIVE.value, UserStatus.SUSPENDED.value}:
        raise HTTPException(status_code=422, detail="Status must be ACTIVE or SUSPENDED")
    target.status = UserStatus(requested)
    if target.status is UserStatus.SUSPENDED:
        await session.execute(
            delete(RefreshSession).where(RefreshSession.user_id == target.id)
        )
    return {"data": {"id": target.id, "status": target.status.value}, "meta": _meta(request)}


@router.delete("/admin/users/{user_id}", status_code=204)
async def admin_delete_user(
    user_id: UUID,
    admin: AdminUser,
    session: DatabaseSession,
) -> Response:
    target = await session.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    if target.id == admin.id or target.role.name is UserRole.ADMIN:
        raise HTTPException(status_code=409, detail="Administrator accounts cannot be deleted")
    await session.delete(target)
    return Response(status_code=204)


@router.get("/admin/assessments")
async def admin_assessments(
    request: Request,
    _user: AdminUser,
    session: DatabaseSession,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
    search: Annotated[str, Query(max_length=120)] = "",
) -> dict[str, object]:
    statement = (
        select(PredictionRecord, User)
        .outerjoin(User, User.id == PredictionRecord.user_id)
        .order_by(PredictionRecord.created_at.desc())
        .limit(limit)
    )
    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                PredictionRecord.predicted_disease_name.ilike(pattern),
                User.email.ilike(pattern),
            )
        )
    rows = (await session.execute(statement)).all()
    return {
        "data": [
            {
                "id": record.id,
                "user_email": owner.email if owner else "Deleted user",
                "disease": record.predicted_disease_name,
                "confidence": record.confidence,
                "severity": record.disease_severity.value,
                "model_version": record.model_version,
                "created_at": record.created_at,
            }
            for record, owner in rows
        ],
        "meta": _meta(request, next_cursor=None, has_more=False),
    }


@router.get("/admin/chats")
async def admin_chats(
    request: Request,
    _user: AdminUser,
    session: DatabaseSession,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> dict[str, object]:
    rows = (
        await session.execute(
            select(LLMConversation, User)
            .outerjoin(User, User.id == LLMConversation.user_id)
            .order_by(LLMConversation.created_at.desc())
            .limit(limit)
        )
    ).all()
    return {
        "data": [
            {
                "id": conversation.id,
                "user_email": owner.email if owner else "Deleted user",
                "prompt": conversation.prompt[:500],
                "response": conversation.response[:1_000],
                "model": conversation.model_name,
                "provider": conversation.provider,
                "created_at": conversation.created_at,
            }
            for conversation, owner in rows
        ],
        "meta": _meta(request, next_cursor=None, has_more=False),
    }


@router.get("/admin/system-health")
async def admin_system_health(request: Request, _user: AdminUser) -> dict[str, object]:
    async def checked(check: Callable[[], Awaitable[bool]]) -> bool:
        try:
            return bool(await check())
        except Exception:  # noqa: BLE001
            return False

    database_ok, redis_ok = await asyncio.gather(
        checked(request.app.state.database.ping),
        checked(request.app.state.redis.ping),
    )
    bundle = request.app.state.ml_service.bundle
    return {
        "data": {
            "api": {"status": "OPERATIONAL", "version": request.app.version},
            "database": {"status": "OPERATIONAL" if database_ok else "DEGRADED"},
            "redis": {"status": "OPERATIONAL" if redis_ok else "DEGRADED"},
            "ml_model": {
                "status": "OPERATIONAL" if bundle else "DEGRADED",
                "version": bundle.model_version if bundle else None,
                "trained_at": bundle.trained_at if bundle else None,
            },
        },
        "meta": _meta(request),
    }


@router.get("/admin/models")
async def admin_models(request: Request, _user: AdminUser) -> dict[str, object]:
    bundle = request.app.state.ml_service.bundle
    data = []
    if bundle:
        data.append(
            {
                "id": uuid5(NAMESPACE_URL, f"mediai:model:{bundle.model_version}"),
                "version": bundle.model_version,
                "status": "ACTIVE",
                "macro_f1": bundle.metrics.get("f1_macro", 0),
                "top5_recall": bundle.metrics.get("top_5_accuracy", 0),
                "p95_latency_ms": 0,
                "promoted_at": bundle.trained_at,
            }
        )
    return {"data": data, "meta": _meta(request, next_cursor=None, has_more=False)}


def _dataset_directory(request: Request) -> Path:
    directory = Path(request.app.state.settings.ml_reports_dir).parent / "datasets"
    directory.mkdir(parents=True, exist_ok=True)
    return directory


@router.get("/admin/datasets")
async def admin_datasets(request: Request, _user: AdminUser) -> dict[str, object]:
    items = []
    for metadata_path in _dataset_directory(request).glob("*.json"):
        metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
        items.append({key: value for key, value in metadata.items() if key != "path"})
    items.sort(key=lambda item: item["created_at"], reverse=True)
    return {"data": items, "meta": _meta(request, next_cursor=None, has_more=False)}


@router.post("/admin/datasets", status_code=201)
async def upload_dataset(
    request: Request,
    _user: AdminUser,
    file: UploadFile = File(...),
    name: str = Form(...),
) -> dict[str, object]:
    identifier = uuid5(NAMESPACE_URL, f"mediai:dataset:{name}:{datetime.now(UTC).isoformat()}")
    directory = _dataset_directory(request)
    csv_path = directory / f"{identifier}.csv"
    content = await file.read()
    csv_path.write_bytes(content)
    try:
        cleaned = clean_training_frame(pd.read_csv(csv_path))
        valid = not cleaned.empty
    except (ValueError, KeyError, pd.errors.ParserError):
        valid = False
        cleaned = pd.DataFrame()
    metadata = {
        "id": str(identifier),
        "name": name,
        "status": "VALID" if valid else "INVALID",
        "row_count": len(cleaned) if valid else None,
        "checksum_verified": True,
        "created_at": datetime.now(UTC).isoformat(),
        "path": str(csv_path),
    }
    (directory / f"{identifier}.json").write_text(json.dumps(metadata), encoding="utf-8")
    public_metadata = {key: value for key, value in metadata.items() if key != "path"}
    return {"data": public_metadata, "meta": _meta(request)}


@router.post("/admin/training-jobs", status_code=202)
async def start_training(
    payload: dict[str, object], request: Request, _user: AdminUser
) -> dict[str, object]:
    identifier = str(payload.get("dataset_id", ""))
    metadata_path = _dataset_directory(request) / f"{identifier}.json"
    if not metadata_path.is_file():
        raise HTTPException(status_code=404, detail="Dataset not found")
    metadata = json.loads(metadata_path.read_text(encoding="utf-8"))
    if metadata["status"] != "VALID":
        raise HTTPException(status_code=409, detail="Dataset is not valid")
    service = request.app.state.ml_service
    service.settings = service.settings.model_copy(
        update={"ml_dataset_path": metadata["path"]}
    )
    await asyncio.to_thread(service.train_and_export)
    return {"data": {"accepted": True}, "meta": _meta(request)}


@router.get("/admin/audit-logs")
async def admin_audit_logs(
    request: Request,
    _user: AdminUser,
    session: DatabaseSession,
    limit: int = Query(default=10, ge=1, le=100),
) -> dict[str, object]:
    items = (
        await session.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))
    ).all()
    return {
        "data": [
            {
                "id": item.id,
                "actor_label": str(item.actor_id) if item.actor_id else "System",
                "event_label": item.action.replace("_", " ").title(),
                "occurred_at": item.created_at,
            }
            for item in items
        ],
        "meta": _meta(request, next_cursor=None, has_more=False),
    }
