"""Clinical feature HTTP endpoints."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from mediai.features.clinical.schemas import (
    AuditLogItem,
    AuditLogListResponse,
    AnalyticsMetric,
    AnalyticsResponse,
    ClinicalPredictionRequest,
    DashboardResponse,
    DoctorItem,
    DoctorListResponse,
    LLMChatRequest,
    LLMChatResponse,
    NotificationItem,
    NotificationListResponse,
    PredictionHistoryItem,
    PredictionHistoryResponse,
    PredictionResponse,
    ReportResponse,
    ReportFormat,
    SettingItem,
    SettingListResponse,
    TopDiseaseItem,
)
from mediai.core.enums import DiseaseSeverity
from mediai.infrastructure.database.clinical_models import Notification, ReportArtifact
from mediai.features.auth.models import AuditLog
from mediai.infrastructure.database.dependencies import get_database_session

from .service import ClinicalService

router = APIRouter(prefix="/clinical", tags=["Clinical Intelligence"])

DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]


def get_clinical_service(request: Request, session: DatabaseSession) -> ClinicalService:
    return ClinicalService(
        session=session,
        settings=request.app.state.settings,
        model_service=request.app.state.ml_service,
        llm_service=request.app.state.llm_service,
    )


ClinicalServiceDependency = Annotated[ClinicalService, Depends(get_clinical_service)]


def _history_item(record) -> PredictionHistoryItem:
    return PredictionHistoryItem(
        id=record.id,
        request_id=record.request_id,
        predicted_disease_code=record.predicted_disease_code,
        predicted_disease_name=record.predicted_disease_name,
        disease_severity=record.disease_severity,
        probability=record.probability,
        confidence=record.confidence,
        created_at=record.created_at,
    )


@router.post("/predictions", summary="Run a clinical prediction")
async def predict(
    payload: ClinicalPredictionRequest,
    request: Request,
    service: ClinicalServiceDependency,
) -> PredictionResponse:
    principal = getattr(request.state, "principal", None)
    result = await service.predict(payload, request.state.request_id, getattr(principal, "user_id", None))
    model_result = result["model_result"]
    llm = result["llm"]
    return PredictionResponse(
        primary_disease_code=str(model_result["primary_disease_code"]),
        primary_disease_name=str(model_result["primary_disease_name"]),
        top_diseases=[TopDiseaseItem(**item) for item in model_result["top_diseases"]],
        probability=float(model_result["probability"]),
        confidence=float(model_result["confidence"]),
        severity=model_result["severity"],
        explanation=model_result["explanation"],
        disease_explanation=llm.disease_explanation,
        medical_summary=llm.medical_summary,
        chat_response=llm.chat_response,
        lab_recommendations=llm.lab_recommendations,
        specialist_recommendations=llm.specialist_recommendations,
        lifestyle_advice=llm.lifestyle_advice,
        model_version=str(model_result["model_version"]),
        llm_provider=request.app.state.llm_service.provider,
    )


@router.get("/predictions/history", summary="List prediction history")
async def prediction_history(
    request: Request,
    service: ClinicalServiceDependency,
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0, le=10_000),
    disease_code: str | None = Query(default=None, max_length=64),
    severity: DiseaseSeverity | None = Query(default=None),
    query: str | None = Query(default=None, max_length=200),
) -> PredictionHistoryResponse:
    principal = getattr(request.state, "principal", None)
    items, total = await service.list_history(
        limit=limit,
        offset=offset,
        user_id=getattr(principal, "user_id", None),
        disease_code=disease_code,
        severity=severity,
        query=query,
    )
    return PredictionHistoryResponse(items=[_history_item(item) for item in items], total=total, limit=limit, offset=offset)


@router.get("/dashboard", summary="Clinical dashboard summary")
async def dashboard(request: Request, service: ClinicalServiceDependency) -> DashboardResponse:
    principal = getattr(request.state, "principal", None)
    data = await service.dashboard(getattr(principal, "user_id", None))
    return DashboardResponse(
        total_predictions=int(data["total_predictions"]),
        top_diseases=[AnalyticsMetric(**item) for item in data["top_diseases"]],
        severity_breakdown=[AnalyticsMetric(**item) for item in data["severity_breakdown"]],
        recent_predictions=[_history_item(item) for item in data["recent_predictions"]],
        unread_notifications=int(data["unread_notifications"]),
    )


@router.get("/reports/{prediction_id}", summary="Generate a PDF report")
async def generate_report(
    prediction_id: UUID,
    service: ClinicalServiceDependency,
    request: Request,
) -> ReportResponse:
    principal = getattr(request.state, "principal", None)
    artifact = await service.generate_report(prediction_id, getattr(principal, "user_id", None))
    return ReportResponse(
        report_id=artifact.id,
        file_name=artifact.file_name,
        mime_type=artifact.mime_type,
        format=ReportFormat.PDF,
        download_url=f"/api/v1/clinical/reports/{artifact.id}/download",
    )


@router.get("/reports/{report_id}/download", summary="Download a report")
async def download_report(report_id: UUID, session: DatabaseSession) -> dict[str, object]:
    artifact = await session.get(ReportArtifact, report_id)
    if artifact is None:
        return {"detail": "Report not found"}
    return {"file_name": artifact.file_name, "mime_type": artifact.mime_type, "file_path": artifact.file_path}


@router.get("/doctors", summary="Search the doctor directory")
async def doctors(
    service: ClinicalServiceDependency,
    search: str | None = Query(default=None, max_length=200),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0, le=10_000),
) -> DoctorListResponse:
    items, total = await service.list_doctors(limit=limit, offset=offset, search=search)
    return DoctorListResponse(
        items=[
            DoctorItem(
                id=item.id,
                full_name=item.full_name,
                specialty=item.specialty,
                hospital_name=item.hospital_name,
                bio=item.bio,
                languages=list(item.languages),
                is_active=item.is_active,
            )
            for item in items
        ],
        total=total,
    )


@router.get("/notifications", summary="List notifications")
async def notifications(request: Request) -> NotificationListResponse:
    session = request.app.state.database.session_factory()
    async with session as db:
        statement = (
            select(Notification)
            .order_by(Notification.created_at.desc())
            .limit(100)
        )
        principal = getattr(request.state, "principal", None)
        if principal is not None:
            statement = statement.where(Notification.user_id == principal.user_id)
        items = (await db.scalars(statement)).all()
        return NotificationListResponse(
            items=[
                NotificationItem(
                    id=item.id,
                    channel=item.channel,
                    status=item.status,
                    title=item.title,
                    body=item.body,
                    created_at=item.created_at,
                )
                for item in items
            ],
            total=len(items),
        )


@router.post("/chat", summary="AI medical chat")
async def chat(payload: LLMChatRequest, service: ClinicalServiceDependency, request: Request) -> LLMChatResponse:
    principal = getattr(request.state, "principal", None)
    answer = await service.chat(payload.message, {"request_id": request.state.request_id, "user_id": getattr(principal, "user_id", None)})
    return LLMChatResponse(answer=answer)


@router.get("/settings", summary="Runtime settings summary")
async def settings_summary(request: Request) -> SettingListResponse:
    settings = request.app.state.settings
    return SettingListResponse(
        items=[
            SettingItem(key="ml_model_version", value=request.app.state.ml_service.bundle.model_version),
            SettingItem(key="llm_provider", value=request.app.state.llm_service.provider),
            SettingItem(key="docs_enabled", value=settings.docs_enabled),
            SettingItem(key="rate_limit_enabled", value=settings.rate_limit_enabled),
        ]
    )


@router.get("/analytics", summary="Clinical analytics")
async def analytics(request: Request, service: ClinicalServiceDependency) -> AnalyticsResponse:
    principal = getattr(request.state, "principal", None)
    dashboard_data = await service.dashboard(getattr(principal, "user_id", None))
    return AnalyticsResponse(
        metrics=[
            AnalyticsMetric(label="total_predictions", value=float(dashboard_data["total_predictions"])),
            AnalyticsMetric(label="unread_notifications", value=float(dashboard_data["unread_notifications"])),
        ],
        chart_payload={
            "top_diseases": dashboard_data["top_diseases"],
            "severity_breakdown": dashboard_data["severity_breakdown"],
        },
    )


@router.get("/audit-logs", summary="List audit logs")
async def audit_logs(
    request: Request,
    service: ClinicalServiceDependency,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0, le=10_000),
) -> AuditLogListResponse:
    principal = getattr(request.state, "principal", None)
    items, total = await service.list_audit_logs(limit=limit, offset=offset, user_id=getattr(principal, "user_id", None))
    return AuditLogListResponse(
        items=[
            AuditLogItem(
                id=item.id,
                action=item.action,
                resource_type=item.resource_type,
                resource_id=item.resource_id,
                outcome=item.outcome.value,
                request_id=item.request_id,
                created_at=item.created_at,
            )
            for item in items
        ],
        total=total,
    )