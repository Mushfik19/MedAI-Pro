"""Clinical prediction, catalog, history, report, and notification models."""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, JSON, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from mediai.core.enums import DiseaseSeverity, NotificationChannel, NotificationStatus
from mediai.infrastructure.database.models import Base, TimestampMixin, UUIDPrimaryKeyMixin

json_type = JSON().with_variant(JSONB(), "postgresql")


class DiseaseCatalog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "disease_catalog"
    __table_args__ = (
        UniqueConstraint("code", name="uq_disease_catalog_code"),
        Index("ix_disease_catalog_severity_specialty", "severity", "specialty"),
    )

    code: Mapped[str] = mapped_column(String(64), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[DiseaseSeverity] = mapped_column(
        Enum(DiseaseSeverity, name="disease_severity", native_enum=True),
        nullable=False,
    )
    specialty: Mapped[str] = mapped_column(String(128), nullable=False)
    symptom_profile: Mapped[dict[str, Any]] = mapped_column(json_type, nullable=False)
    recommended_labs: Mapped[list[str]] = mapped_column(json_type, nullable=False)
    recommended_specialists: Mapped[list[str]] = mapped_column(json_type, nullable=False)
    lifestyle_advice: Mapped[list[str]] = mapped_column(json_type, nullable=False)
    triage_guidance: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class PredictionRecord(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "prediction_records"
    __table_args__ = (
        Index("ix_prediction_records_user_created_at", "user_id", "created_at"),
        Index("ix_prediction_records_disease_created_at", "predicted_disease_code", "created_at"),
    )

    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    request_id: Mapped[str] = mapped_column(String(128), nullable=False)
    input_payload: Mapped[dict[str, Any]] = mapped_column(json_type, nullable=False)
    top_diseases: Mapped[list[dict[str, Any]]] = mapped_column(json_type, nullable=False)
    predicted_disease_code: Mapped[str] = mapped_column(String(64), nullable=False)
    predicted_disease_name: Mapped[str] = mapped_column(String(128), nullable=False)
    disease_severity: Mapped[DiseaseSeverity] = mapped_column(
        Enum(DiseaseSeverity, name="disease_severity", native_enum=True),
        nullable=False,
    )
    probability: Mapped[float] = mapped_column(nullable=False)
    confidence: Mapped[float] = mapped_column(nullable=False)
    explanation: Mapped[list[dict[str, Any]]] = mapped_column(json_type, nullable=False)
    model_version: Mapped[str] = mapped_column(String(64), nullable=False)
    llm_summary: Mapped[str | None] = mapped_column(Text)
    lab_recommendations: Mapped[list[str]] = mapped_column(json_type, nullable=False)
    specialist_recommendations: Mapped[list[str]] = mapped_column(json_type, nullable=False)
    lifestyle_advice: Mapped[list[str]] = mapped_column(json_type, nullable=False)
    created_by: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))


class ReportArtifact(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "report_artifacts"
    __table_args__ = (Index("ix_report_artifacts_prediction_created_at", "prediction_id", "created_at"),)

    prediction_id: Mapped[UUID] = mapped_column(
        ForeignKey("prediction_records.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    mime_type: Mapped[str] = mapped_column(String(64), nullable=False)
    file_path: Mapped[str] = mapped_column(String(512), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    chart_payload: Mapped[dict[str, Any]] = mapped_column(json_type, nullable=False)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Notification(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_user_status_created_at", "user_id", "status", "created_at"),
    )

    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    channel: Mapped[NotificationChannel] = mapped_column(
        Enum(NotificationChannel, name="notification_channel", native_enum=True),
        nullable=False,
    )
    status: Mapped[NotificationStatus] = mapped_column(
        Enum(NotificationStatus, name="notification_status", native_enum=True),
        nullable=False,
        default=NotificationStatus.UNREAD,
    )
    title: Mapped[str] = mapped_column(String(160), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(json_type, nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class UserPreference(TimestampMixin, Base):
    __tablename__ = "user_preferences"

    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    language: Mapped[str] = mapped_column(String(16), nullable=False, default="en")
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="UTC")
    email_notifications: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    dashboard_preferences: Mapped[dict[str, Any]] = mapped_column(json_type, nullable=False)
    notification_filters: Mapped[dict[str, Any]] = mapped_column(json_type, nullable=False)


class DoctorDirectory(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "doctor_directory"
    __table_args__ = (
        Index("ix_doctor_directory_specialty_active", "specialty", "is_active"),
        UniqueConstraint("license_number", name="uq_doctor_directory_license_number"),
    )

    full_name: Mapped[str] = mapped_column(String(160), nullable=False)
    specialty: Mapped[str] = mapped_column(String(128), nullable=False)
    license_number: Mapped[str] = mapped_column(String(64), nullable=False)
    hospital_name: Mapped[str] = mapped_column(String(160), nullable=False)
    bio: Mapped[str] = mapped_column(Text, nullable=False)
    languages: Mapped[list[str]] = mapped_column(json_type, nullable=False)
    availability: Mapped[dict[str, Any]] = mapped_column(json_type, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)


class LLMConversation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "llm_conversations"
    __table_args__ = (Index("ix_llm_conversations_user_created_at", "user_id", "created_at"),)

    user_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    request_id: Mapped[str] = mapped_column(String(128), nullable=False)
    prompt: Mapped[str] = mapped_column(Text, nullable=False)
    response: Mapped[str] = mapped_column(Text, nullable=False)
    model_name: Mapped[str] = mapped_column(String(128), nullable=False)
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    context_payload: Mapped[dict[str, Any]] = mapped_column(json_type, nullable=False)
