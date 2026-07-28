"""Clinical application services for prediction, reporting, dashboard, and AI assistance."""

from __future__ import annotations

import io
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from uuid import UUID, uuid4

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from mediai.core.config import Settings
from mediai.core.enums import AuditOutcome, DiseaseSeverity, NotificationChannel, NotificationStatus
from mediai.features.clinical.schemas import ClinicalPredictionRequest
from mediai.infrastructure.database.clinical_models import DoctorDirectory, Notification, PredictionRecord, ReportArtifact
from mediai.features.auth.models import AuditLog
from mediai.infrastructure.llm.service import MedicalLLMService
from mediai.infrastructure.ml.service import ClinicalModelService
from mediai.shared.domain.exceptions import ModelUnavailableError, ReportGenerationError


class ClinicalService:
    """Coordinate model inference, persistence, reporting, and LLM enrichment."""

    def __init__(
        self,
        *,
        session: AsyncSession,
        settings: Settings,
        model_service: ClinicalModelService,
        llm_service: MedicalLLMService,
    ) -> None:
        self.session = session
        self.settings = settings
        self.model_service = model_service
        self.llm_service = llm_service

    async def predict(
        self,
        payload: ClinicalPredictionRequest | dict[str, float],
        request_id: str,
        user_id: UUID | None = None,
    ) -> dict[str, object]:
        if self.model_service.bundle is None:
            raise ModelUnavailableError()
        payload_data = (
            payload.model_dump(mode="python")
            if isinstance(payload, ClinicalPredictionRequest)
            else dict(payload)
        )
        model_result = self.model_service.predict(payload_data)
        profile = self.model_service.disease_profile(str(model_result["primary_disease_code"]))
        explanation_text = "; ".join(
            f"{item['feature']} ({item['rationale']})" for item in model_result["explanation"]
        )
        enrichment = await self.llm_service.enrich_prediction(
            disease_name=str(model_result["primary_disease_name"]),
            disease_severity=str(model_result["severity"]),
            probability=float(model_result["probability"]),
            confidence=float(model_result["confidence"]),
            explanation=explanation_text,
            labs=list(profile["recommended_labs"]),
            specialists=list(profile["recommended_specialists"]),
            lifestyle=list(profile["lifestyle_advice"]),
            context=payload_data,
        )
        prediction = PredictionRecord(
            user_id=user_id,
            request_id=request_id,
            input_payload=payload_data,
            top_diseases=[dict(item) for item in model_result["top_diseases"]],
            predicted_disease_code=str(model_result["primary_disease_code"]),
            predicted_disease_name=str(model_result["primary_disease_name"]),
            disease_severity=DiseaseSeverity(str(model_result["severity"])),
            probability=float(model_result["probability"]),
            confidence=float(model_result["confidence"]),
            explanation=list(model_result["explanation"]),
            model_version=str(model_result["model_version"]),
            llm_summary=enrichment.medical_summary,
            lab_recommendations=enrichment.lab_recommendations,
            specialist_recommendations=enrichment.specialist_recommendations,
            lifestyle_advice=enrichment.lifestyle_advice,
            created_by=user_id,
        )
        self.session.add(prediction)
        await self.session.flush()
        await self.session.execute(
            select(func.count()).select_from(PredictionRecord)
        )
        notification = Notification(
            user_id=user_id,
            channel=NotificationChannel.IN_APP,
            status=NotificationStatus.UNREAD,
            title=f"Prediction ready: {prediction.predicted_disease_name}",
            body=enrichment.disease_explanation,
            payload={"prediction_id": str(prediction.id), "request_id": request_id},
        )
        self.session.add(notification)
        self.session.add(
            AuditLog(
                actor_id=user_id,
                action="clinical.prediction_created",
                resource_type="prediction_record",
                resource_id=prediction.id,
                outcome=AuditOutcome.SUCCESS,
                request_id=request_id,
                ip_hash=None,
                user_agent=None,
                changes={"disease_code": prediction.predicted_disease_code, "probability": prediction.probability},
                created_at=datetime.now(UTC),
            )
        )
        await self.session.flush()
        await self.session.commit()
        await self.session.refresh(prediction)
        return {
            "prediction": prediction,
            "model_result": model_result,
            "profile": profile,
            "llm": enrichment,
        }

    async def list_history(
        self,
        *,
        limit: int,
        offset: int,
        user_id: UUID | None = None,
        disease_code: str | None = None,
        severity: DiseaseSeverity | None = None,
        query: str | None = None,
    ) -> tuple[list[PredictionRecord], int]:
        statement = select(PredictionRecord).order_by(PredictionRecord.created_at.desc()).limit(limit).offset(offset)
        count_statement = select(func.count()).select_from(PredictionRecord)
        if user_id is not None:
            statement = statement.where(PredictionRecord.user_id == user_id)
            count_statement = count_statement.where(PredictionRecord.user_id == user_id)
        if disease_code is not None:
            statement = statement.where(PredictionRecord.predicted_disease_code == disease_code)
            count_statement = count_statement.where(PredictionRecord.predicted_disease_code == disease_code)
        if severity is not None:
            statement = statement.where(PredictionRecord.disease_severity == severity)
            count_statement = count_statement.where(PredictionRecord.disease_severity == severity)
        if query is not None:
            term = f"%{query}%"
            statement = statement.where(
                PredictionRecord.predicted_disease_name.ilike(term)
                | PredictionRecord.predicted_disease_code.ilike(term)
                | PredictionRecord.request_id.ilike(term)
            )
            count_statement = count_statement.where(
                PredictionRecord.predicted_disease_name.ilike(term)
                | PredictionRecord.predicted_disease_code.ilike(term)
                | PredictionRecord.request_id.ilike(term)
            )
        items = (await self.session.scalars(statement)).all()
        total = int(await self.session.scalar(count_statement) or 0)
        return items, total

    async def dashboard(self, user_id: UUID | None = None) -> dict[str, object]:
        limit = self.settings.dashboard_default_limit
        history, total = await self.list_history(limit=limit, offset=0, user_id=user_id)
        disease_counter = Counter(item.predicted_disease_name for item in history)
        severity_counter = Counter(item.disease_severity.value for item in history)
        unread_query = select(func.count()).select_from(Notification).where(Notification.status == NotificationStatus.UNREAD)
        if user_id is not None:
            unread_query = unread_query.where(Notification.user_id == user_id)
        unread_notifications = int(await self.session.scalar(unread_query) or 0)
        return {
            "total_predictions": total,
            "top_diseases": [{"label": label, "value": float(count)} for label, count in disease_counter.most_common(5)],
            "severity_breakdown": [{"label": label, "value": float(count)} for label, count in severity_counter.most_common()],
            "recent_predictions": history,
            "unread_notifications": unread_notifications,
        }

    async def generate_report(self, prediction_id: UUID, user_id: UUID | None = None) -> ReportArtifact:
        prediction = await self.session.get(PredictionRecord, prediction_id)
        if prediction is None:
            raise ReportGenerationError("Prediction not found for report generation.")
        output_dir = Path(self.settings.ml_reports_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        file_name = f"prediction-{prediction.id}.pdf"
        file_path = output_dir / file_name
        try:
            buffer = io.BytesIO()
            document = SimpleDocTemplate(
                buffer,
                pagesize=A4,
                leftMargin=16 * mm,
                rightMargin=16 * mm,
                topMargin=16 * mm,
                bottomMargin=16 * mm,
            )
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                "ReportTitle",
                parent=styles["Title"],
                fontSize=18,
                leading=22,
                textColor=colors.HexColor("#0F172A"),
            )
            story = [
                Paragraph("Clinical Prediction Report", title_style),
                Spacer(1, 6 * mm),
                Paragraph(f"Prediction ID: {prediction.id}", styles["Normal"]),
                Paragraph(f"Primary disease: {prediction.predicted_disease_name}", styles["Normal"]),
                Paragraph(f"Severity: {prediction.disease_severity.value}", styles["Normal"]),
                Paragraph(f"Probability: {prediction.probability:.2%}", styles["Normal"]),
                Paragraph(f"Confidence: {prediction.confidence:.2%}", styles["Normal"]),
                Spacer(1, 4 * mm),
            ]
            table_data = [["Top disease", "Probability", "Severity"]]
            for item in prediction.top_diseases:
                table_data.append([item["name"], f"{float(item['probability']):.2%}", str(item["severity"])])
            table = Table(table_data, colWidths=[70 * mm, 40 * mm, 40 * mm])
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1D4ED8")),
                        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.whitesmoke, colors.HexColor("#F8FAFC")]),
                    ]
                )
            )
            story.append(table)
            story.append(Spacer(1, 4 * mm))
            story.append(Paragraph(f"LLM summary: {prediction.llm_summary or 'N/A'}", styles["BodyText"]))
            document.build(story)
            file_path.write_bytes(buffer.getvalue())
        except Exception as error:  # noqa: BLE001
            raise ReportGenerationError() from error

        artifact = ReportArtifact(
            prediction_id=prediction.id,
            user_id=user_id,
            file_name=file_name,
            mime_type="application/pdf",
            file_path=str(file_path),
            summary=prediction.llm_summary or "Clinical prediction report",
            chart_payload={"top_diseases": prediction.top_diseases},
            generated_at=datetime.now(UTC),
        )
        self.session.add(artifact)
        self.session.add(
            AuditLog(
                actor_id=user_id,
                action="clinical.report_generated",
                resource_type="report_artifact",
                resource_id=artifact.id,
                outcome=AuditOutcome.SUCCESS,
                request_id=str(prediction.request_id),
                ip_hash=None,
                user_agent=None,
                changes={"prediction_id": str(prediction.id), "file_name": file_name},
                created_at=datetime.now(UTC),
            )
        )
        await self.session.commit()
        await self.session.refresh(artifact)
        return artifact

    async def list_doctors(self, *, limit: int, offset: int, search: str | None = None) -> tuple[list[DoctorDirectory], int]:
        statement = select(DoctorDirectory).order_by(DoctorDirectory.full_name.asc()).limit(limit).offset(offset)
        count_statement = select(func.count()).select_from(DoctorDirectory)
        if search:
            term = f"%{search.strip()}%"
            statement = statement.where(
                DoctorDirectory.full_name.ilike(term) | DoctorDirectory.specialty.ilike(term) | DoctorDirectory.hospital_name.ilike(term)
            )
            count_statement = count_statement.where(
                DoctorDirectory.full_name.ilike(term) | DoctorDirectory.specialty.ilike(term) | DoctorDirectory.hospital_name.ilike(term)
            )
        items = (await self.session.scalars(statement)).all()
        total = int(await self.session.scalar(count_statement) or 0)
        return items, total

    async def search_predictions(
        self,
        query: str,
        limit: int,
        offset: int,
        user_id: UUID | None = None,
        disease_code: str | None = None,
        severity: DiseaseSeverity | None = None,
    ) -> tuple[list[PredictionRecord], int]:
        return await self.list_history(
            limit=limit,
            offset=offset,
            user_id=user_id,
            disease_code=disease_code,
            severity=severity,
            query=query,
        )

    async def list_audit_logs(self, *, limit: int, offset: int, user_id: UUID | None = None) -> tuple[list[AuditLog], int]:
        statement = select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).offset(offset)
        count_statement = select(func.count()).select_from(AuditLog)
        if user_id is not None:
            statement = statement.where(AuditLog.actor_id == user_id)
            count_statement = count_statement.where(AuditLog.actor_id == user_id)
        items = (await self.session.scalars(statement)).all()
        total = int(await self.session.scalar(count_statement) or 0)
        return items, total

    async def chat(self, message: str, context: dict[str, object]) -> str:
        answer = await self.llm_service.answer_chat(user_message=message, context=context)
        self.session.add(
            AuditLog(
                actor_id=context.get("user_id") if isinstance(context.get("user_id"), UUID) else None,
                action="clinical.chat_completed",
                resource_type="llm_conversation",
                resource_id=uuid4(),
                outcome=AuditOutcome.SUCCESS,
                request_id=str(context.get("request_id", uuid4())),
                ip_hash=None,
                user_agent=None,
                changes={"message_length": len(message)},
                created_at=datetime.now(UTC),
            )
        )
        await self.session.flush()
        await self.session.commit()
        return answer
