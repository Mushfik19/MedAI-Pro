"""SQLAlchemy identity, authorization, session, and audit models."""

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from mediai.core.enums import (
    AuditOutcome,
    EmailDeliveryStatus,
    Permission,
    UserRole,
    UserStatus,
    VerificationPurpose,
)
from mediai.infrastructure.database.models import (
    Base,
    TimestampMixin,
    UUIDPrimaryKeyMixin,
    VersionMixin,
)

json_type = JSON().with_variant(JSONB(), "postgresql")


class Role(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "roles"

    name: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role", native_enum=True),
        unique=True,
        nullable=False,
    )
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    is_system: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    permissions: Mapped[list["PermissionModel"]] = relationship(
        secondary="role_permissions",
        lazy="selectin",
        viewonly=True,
    )


class PermissionModel(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "permissions"

    code: Mapped[Permission] = mapped_column(
        Enum(
            Permission,
            name="permission_code",
            native_enum=True,
            values_callable=lambda members: [member.value for member in members],
        ),
        unique=True,
        nullable=False,
    )
    description: Mapped[str] = mapped_column(String(255), nullable=False)


class RolePermission(Base):
    __tablename__ = "role_permissions"

    role_id: Mapped[UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True,
    )
    permission_id: Mapped[UUID] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True,
    )


class User(UUIDPrimaryKeyMixin, TimestampMixin, VersionMixin, Base):
    __tablename__ = "users"
    __table_args__ = (
        Index("ix_users_role_status", "role_id", "status"),
        Index("ix_users_created_at", "created_at"),
    )

    username: Mapped[str | None] = mapped_column(String(64), unique=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[UUID] = mapped_column(ForeignKey("roles.id"), nullable=False)
    status: Mapped[UserStatus] = mapped_column(
        Enum(UserStatus, name="user_status", native_enum=True),
        nullable=False,
        default=UserStatus.ACTIVE,
    )
    email_verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    password_changed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    role: Mapped[Role] = relationship(lazy="joined")
    profile: Mapped["UserProfile"] = relationship(
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="joined",
        uselist=False,
    )


class UserProfile(TimestampMixin, Base):
    __tablename__ = "user_profiles"

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), nullable=False)

    user: Mapped[User] = relationship(back_populates="profile")


class UserConsent(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "user_consents"
    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "document_id",
            name="uq_user_consents_user_id_document_id",
        ),
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    document_id: Mapped[UUID] = mapped_column(nullable=False)
    accepted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class RefreshSession(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "refresh_sessions"
    __table_args__ = (
        Index("ix_refresh_sessions_user_id_expires_at", "user_id", "expires_at"),
        Index("ix_refresh_sessions_family_id", "family_id"),
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    family_id: Mapped[UUID] = mapped_column(nullable=False)
    token_jti: Mapped[UUID] = mapped_column(unique=True, nullable=False)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    csrf_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    last_used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    replaced_by_id: Mapped[UUID | None] = mapped_column(
        ForeignKey("refresh_sessions.id", ondelete="SET NULL")
    )
    ip_hash: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(512))


class VerificationToken(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "verification_tokens"
    __table_args__ = (
        Index(
            "ix_verification_tokens_user_purpose",
            "user_id",
            "purpose",
        ),
    )

    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    purpose: Mapped[VerificationPurpose] = mapped_column(
        Enum(VerificationPurpose, name="verification_purpose", native_enum=True),
        nullable=False,
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    consumed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class EmailOutbox(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "email_outbox"
    __table_args__ = (Index("ix_email_outbox_status_created_at", "status", "created_at"),)

    recipient: Mapped[str] = mapped_column(String(320), nullable=False)
    template: Mapped[str] = mapped_column(String(64), nullable=False)
    payload: Mapped[dict[str, Any]] = mapped_column(json_type, nullable=False)
    status: Mapped[EmailDeliveryStatus] = mapped_column(
        Enum(EmailDeliveryStatus, name="email_delivery_status", native_enum=True),
        nullable=False,
        default=EmailDeliveryStatus.PENDING,
    )
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    attempts: Mapped[int] = mapped_column(nullable=False, default=0)
    last_error: Mapped[str | None] = mapped_column(Text)


class AuditLog(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "audit_logs"
    __table_args__ = (
        Index("ix_audit_logs_actor_created_at", "actor_id", "created_at"),
        Index("ix_audit_logs_resource", "resource_type", "resource_id"),
    )

    actor_id: Mapped[UUID | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"))
    action: Mapped[str] = mapped_column(String(128), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(64), nullable=False)
    resource_id: Mapped[UUID | None] = mapped_column()
    outcome: Mapped[AuditOutcome] = mapped_column(
        Enum(AuditOutcome, name="audit_outcome", native_enum=True),
        nullable=False,
    )
    request_id: Mapped[str] = mapped_column(String(128), nullable=False)
    ip_hash: Mapped[str | None] = mapped_column(String(64))
    user_agent: Mapped[str | None] = mapped_column(String(512))
    changes: Mapped[dict[str, Any]] = mapped_column(json_type, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
