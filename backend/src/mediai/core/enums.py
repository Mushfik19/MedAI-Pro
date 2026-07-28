"""Stable enumerations shared across infrastructure and future features."""

from enum import StrEnum


class Environment(StrEnum):
    LOCAL = "local"
    TEST = "test"
    STAGING = "staging"
    PRODUCTION = "production"


class UserRole(StrEnum):
    PATIENT = "PATIENT"
    DOCTOR = "DOCTOR"
    ADMIN = "ADMIN"


class UserStatus(StrEnum):
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DEACTIVATED = "DEACTIVATED"


class Permission(StrEnum):
    PREDICTION_READ = "prediction:read"
    PREDICTION_CREATE = "prediction:create"
    CHAT_USE = "chat:use"
    PROFILE_MANAGE = "profile:manage"
    PATIENT_READ = "patient:read"
    PREDICTION_REVIEW = "prediction:review"
    CLINICAL_NOTE_CREATE = "clinical-note:create"
    USER_MANAGE = "user:manage"
    CATALOG_MANAGE = "catalog:manage"
    MODEL_MANAGE = "model:manage"
    ANALYTICS_READ = "analytics:read"
    AUDIT_READ = "audit:read"


class TokenType(StrEnum):
    ACCESS = "access"
    REFRESH = "refresh"


class VerificationPurpose(StrEnum):
    EMAIL_VERIFICATION = "EMAIL_VERIFICATION"
    PASSWORD_RESET = "PASSWORD_RESET"  # noqa: S105


class AuditOutcome(StrEnum):
    SUCCESS = "SUCCESS"
    DENIED = "DENIED"
    FAILURE = "FAILURE"


class EmailDeliveryStatus(StrEnum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SENT = "SENT"
    FAILED = "FAILED"


class HealthStatus(StrEnum):
    OK = "ok"
    DEGRADED = "degraded"


class DiseaseSeverity(StrEnum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class NotificationChannel(StrEnum):
    IN_APP = "IN_APP"
    EMAIL = "EMAIL"
    SMS = "SMS"
    PUSH = "PUSH"


class NotificationStatus(StrEnum):
    UNREAD = "UNREAD"
    READ = "READ"
    ARCHIVED = "ARCHIVED"


class ReportFormat(StrEnum):
    PDF = "PDF"
    JSON = "JSON"


class LLMProvider(StrEnum):
    OPENAI_COMPATIBLE = "OPENAI_COMPATIBLE"
    OFFLINE = "OFFLINE"
