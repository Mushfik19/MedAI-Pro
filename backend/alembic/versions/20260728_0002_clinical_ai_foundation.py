"""Create clinical AI foundation tables.

Revision ID: 20260728_0002
Revises: 20260726_0001
Create Date: 2026-07-28 00:02:00
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260728_0002"
down_revision: str | None = "20260726_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    disease_severity = postgresql.ENUM("LOW", "MODERATE", "HIGH", "CRITICAL", name="disease_severity", create_type=False)
    notification_channel = postgresql.ENUM("IN_APP", "EMAIL", "SMS", "PUSH", name="notification_channel", create_type=False)
    notification_status = postgresql.ENUM("UNREAD", "READ", "ARCHIVED", name="notification_status", create_type=False)

    bind = op.get_bind()
    for enum_type in (disease_severity, notification_channel, notification_status):
        enum_type.create(bind, checkfirst=True)

    json_type = sa.JSON().with_variant(postgresql.JSONB(), "postgresql")

    op.create_table(
        "disease_catalog",
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("severity", disease_severity, nullable=False),
        sa.Column("specialty", sa.String(length=128), nullable=False),
        sa.Column("symptom_profile", json_type, nullable=False),
        sa.Column("recommended_labs", json_type, nullable=False),
        sa.Column("recommended_specialists", json_type, nullable=False),
        sa.Column("lifestyle_advice", json_type, nullable=False),
        sa.Column("triage_guidance", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_disease_catalog")),
        sa.UniqueConstraint("code", name="uq_disease_catalog_code"),
    )
    op.create_index("ix_disease_catalog_severity_specialty", "disease_catalog", ["severity", "specialty"])

    op.create_table(
        "prediction_records",
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("request_id", sa.String(length=128), nullable=False),
        sa.Column("input_payload", json_type, nullable=False),
        sa.Column("top_diseases", json_type, nullable=False),
        sa.Column("predicted_disease_code", sa.String(length=64), nullable=False),
        sa.Column("predicted_disease_name", sa.String(length=128), nullable=False),
        sa.Column("disease_severity", disease_severity, nullable=False),
        sa.Column("probability", sa.Float(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("explanation", json_type, nullable=False),
        sa.Column("model_version", sa.String(length=64), nullable=False),
        sa.Column("llm_summary", sa.Text(), nullable=True),
        sa.Column("lab_recommendations", json_type, nullable=False),
        sa.Column("specialist_recommendations", json_type, nullable=False),
        sa.Column("lifestyle_advice", json_type, nullable=False),
        sa.Column("created_by", sa.Uuid(), nullable=True),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], name=op.f("fk_prediction_records_created_by_users"), ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_prediction_records_user_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_prediction_records")),
    )
    op.create_index("ix_prediction_records_user_created_at", "prediction_records", ["user_id", "created_at"])
    op.create_index(
        "ix_prediction_records_disease_created_at",
        "prediction_records",
        ["predicted_disease_code", "created_at"],
    )

    op.create_table(
        "report_artifacts",
        sa.Column("prediction_id", sa.Uuid(), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=64), nullable=False),
        sa.Column("file_path", sa.String(length=512), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("chart_payload", json_type, nullable=False),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["prediction_id"], ["prediction_records.id"], name=op.f("fk_report_artifacts_prediction_id_prediction_records"), ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_report_artifacts_user_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_report_artifacts")),
    )
    op.create_index("ix_report_artifacts_prediction_created_at", "report_artifacts", ["prediction_id", "created_at"])

    op.create_table(
        "notifications",
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("channel", notification_channel, nullable=False),
        sa.Column("status", notification_status, nullable=False),
        sa.Column("title", sa.String(length=160), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("payload", json_type, nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_notifications_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_notifications")),
    )
    op.create_index("ix_notifications_user_status_created_at", "notifications", ["user_id", "status", "created_at"])

    op.create_table(
        "user_preferences",
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("language", sa.String(length=16), nullable=False),
        sa.Column("timezone", sa.String(length=64), nullable=False),
        sa.Column("email_notifications", sa.Boolean(), nullable=False),
        sa.Column("dashboard_preferences", json_type, nullable=False),
        sa.Column("notification_filters", json_type, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_user_preferences_user_id_users"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", name=op.f("pk_user_preferences")),
    )

    op.create_table(
        "doctor_directory",
        sa.Column("full_name", sa.String(length=160), nullable=False),
        sa.Column("specialty", sa.String(length=128), nullable=False),
        sa.Column("license_number", sa.String(length=64), nullable=False),
        sa.Column("hospital_name", sa.String(length=160), nullable=False),
        sa.Column("bio", sa.Text(), nullable=False),
        sa.Column("languages", json_type, nullable=False),
        sa.Column("availability", json_type, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_doctor_directory")),
        sa.UniqueConstraint("license_number", name="uq_doctor_directory_license_number"),
    )
    op.create_index("ix_doctor_directory_specialty_active", "doctor_directory", ["specialty", "is_active"])

    op.create_table(
        "llm_conversations",
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("request_id", sa.String(length=128), nullable=False),
        sa.Column("prompt", sa.Text(), nullable=False),
        sa.Column("response", sa.Text(), nullable=False),
        sa.Column("model_name", sa.String(length=128), nullable=False),
        sa.Column("provider", sa.String(length=64), nullable=False),
        sa.Column("context_payload", json_type, nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_llm_conversations_user_id_users"), ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_llm_conversations")),
    )
    op.create_index("ix_llm_conversations_user_created_at", "llm_conversations", ["user_id", "created_at"])


def downgrade() -> None:
    op.drop_index("ix_llm_conversations_user_created_at", table_name="llm_conversations")
    op.drop_table("llm_conversations")

    op.drop_index("ix_doctor_directory_specialty_active", table_name="doctor_directory")
    op.drop_table("doctor_directory")

    op.drop_table("user_preferences")

    op.drop_index("ix_notifications_user_status_created_at", table_name="notifications")
    op.drop_table("notifications")

    op.drop_index("ix_report_artifacts_prediction_created_at", table_name="report_artifacts")
    op.drop_table("report_artifacts")

    op.drop_index("ix_prediction_records_disease_created_at", table_name="prediction_records")
    op.drop_index("ix_prediction_records_user_created_at", table_name="prediction_records")
    op.drop_table("prediction_records")

    op.drop_index("ix_disease_catalog_severity_specialty", table_name="disease_catalog")
    op.drop_table("disease_catalog")

    bind = op.get_bind()
    for enum_name in ("notification_status", "notification_channel", "disease_severity"):
        sa.Enum(name=enum_name).drop(bind, checkfirst=True)
