"""Validated, environment-driven application configuration."""

from functools import lru_cache
from pathlib import Path
from typing import Literal, Self

from pydantic import Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

from mediai.core.enums import Environment


class Settings(BaseSettings):
    """Immutable application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="MEDIAI_",
        case_sensitive=False,
        extra="ignore",
        frozen=True,
    )

    environment: Environment = Environment.LOCAL
    debug: bool = False
    app_name: str = "MediAI Pro API"
    app_version: str = "0.1.0"
    api_v1_prefix: str = "/api/v1"

    database_url: str
    database_pool_size: int = Field(default=10, ge=1, le=100)
    database_max_overflow: int = Field(default=20, ge=0, le=200)
    database_pool_recycle_seconds: int = Field(default=1_800, ge=60)

    redis_url: str
    celery_broker_url: str
    celery_result_backend: str

    cors_origins: list[str] = Field(default_factory=list)
    cors_allow_credentials: bool = True

    jwt_secret_key: SecretStr
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = "mediai-pro"
    jwt_audience: str = "mediai-pro-api"
    access_token_ttl_minutes: int = Field(default=15, ge=1, le=60)
    refresh_token_ttl_days: int = Field(default=30, ge=1, le=90)
    password_reset_token_ttl_minutes: int = Field(default=30, ge=5, le=120)
    refresh_cookie_name: str = "mediai_refresh"
    refresh_cookie_secure: bool = False
    refresh_cookie_samesite: Literal["lax", "strict", "none"] = "lax"
    frontend_url: str = "http://localhost:5173"
    login_rate_limit_requests: int = Field(default=10, ge=1, le=100)
    login_rate_limit_window_seconds: int = Field(default=60, ge=10, le=3_600)
    seed_default_admin: bool = True
    default_admin_username: str = Field(default="mushfik324", min_length=3, max_length=64)
    default_admin_password: SecretStr = SecretStr("1324")
    default_admin_email: str = "mushfik324@admin.local"

    rate_limit_enabled: bool = True
    rate_limit_requests: int = Field(default=120, ge=1, le=10_000)
    rate_limit_window_seconds: int = Field(default=60, ge=1, le=3_600)
    rate_limit_fail_open: bool = False

    startup_dependency_checks: bool = True
    log_level: str = "INFO"
    log_json: bool = False
    docs_enabled: bool = True

    runtime_root: str = "."
    ml_dataset_path: str = "data/ml/train_disease.csv"
    ml_test_dataset_path: str = "data/ml/test_disease.csv"
    ml_model_artifact_path: str = "data/ml/disease_model.joblib"
    ml_label_encoder_path: str = "data/ml/label_encoder.joblib"
    ml_metrics_path: str = "data/ml/metrics.json"
    ml_reports_dir: str = "artifacts/reports"
    ml_auto_train_on_startup: bool = True
    ml_random_state: int = Field(default=42, ge=1, le=2_147_483_647)

    llm_enabled: bool = False
    llm_base_url: str = ""
    llm_api_key: SecretStr | None = None
    llm_model: str = "gpt-4o-mini"
    llm_timeout_seconds: int = Field(default=30, ge=1, le=300)
    llm_max_tokens: int = Field(default=512, ge=64, le=4_096)

    prediction_history_retention_days: int = Field(default=730, ge=30, le=10_950)
    dashboard_default_limit: int = Field(default=10, ge=1, le=100)
    report_default_limit: int = Field(default=25, ge=1, le=250)

    @field_validator("api_v1_prefix")
    @classmethod
    def validate_api_prefix(cls, value: str) -> str:
        if not value.startswith("/") or value.endswith("/"):
            raise ValueError("API prefix must start with '/' and must not end with '/'")
        return value

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        supported = ("postgresql+asyncpg://", "sqlite+aiosqlite://")
        if not value.startswith(supported):
            raise ValueError("database_url must use asyncpg or aiosqlite")
        return value

    @field_validator("redis_url", "celery_broker_url", "celery_result_backend")
    @classmethod
    def validate_redis_url(cls, value: str) -> str:
        if not value.startswith(("redis://", "rediss://")):
            raise ValueError("Redis URLs must use redis:// or rediss://")
        return value

    @field_validator("log_level")
    @classmethod
    def normalize_log_level(cls, value: str) -> str:
        normalized = value.upper()
        if normalized not in {"TRACE", "DEBUG", "INFO", "SUCCESS", "WARNING", "ERROR", "CRITICAL"}:
            raise ValueError("Unsupported log level")
        return normalized

    @field_validator("default_admin_username")
    @classmethod
    def normalize_admin_username(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized.replace("_", "").replace("-", "").isalnum():
            raise ValueError("default_admin_username contains unsupported characters")
        return normalized

    @model_validator(mode="after")
    def validate_security_configuration(self) -> Self:
        if (
            self.environment is not Environment.TEST
            and len(self.jwt_secret_key.get_secret_value()) < 64
        ):
            raise ValueError("jwt_secret_key must contain at least 64 characters")
        if self.cors_allow_credentials and "*" in self.cors_origins:
            raise ValueError("Wildcard CORS origins cannot be used with credentials")
        if self.environment is Environment.PRODUCTION and self.debug:
            raise ValueError("Debug mode cannot be enabled in production")
        if self.environment is Environment.PRODUCTION and not self.refresh_cookie_secure:
            raise ValueError("Secure refresh cookies are required in production")
        if self.refresh_cookie_samesite == "none" and not self.refresh_cookie_secure:
            raise ValueError("SameSite=None requires secure cookies")
        if self.environment is not Environment.TEST and self.database_url.startswith(
            "sqlite+aiosqlite://"
        ):
            raise ValueError("SQLite is permitted only in the test environment")
        if self.llm_enabled and not self.llm_base_url:
            raise ValueError("llm_base_url is required when llm_enabled is true")
        if self.ml_random_state <= 0:
            raise ValueError("ml_random_state must be positive")
        return self

    @field_validator(
        "ml_dataset_path",
        "ml_test_dataset_path",
        "ml_model_artifact_path",
        "ml_label_encoder_path",
        "ml_metrics_path",
        "ml_reports_dir",
    )
    @classmethod
    def validate_path_fields(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("path settings cannot be empty")
        return str(Path(value))

    @model_validator(mode="after")
    def resolve_runtime_paths(self) -> Self:
        """Resolve application filesystem paths against one stable runtime root."""
        runtime_root = Path(self.runtime_root).expanduser().resolve()
        object.__setattr__(self, "runtime_root", str(runtime_root))
        for field_name in (
            "ml_dataset_path",
            "ml_test_dataset_path",
            "ml_model_artifact_path",
            "ml_label_encoder_path",
            "ml_metrics_path",
            "ml_reports_dir",
        ):
            configured_path = Path(getattr(self, field_name)).expanduser()
            resolved_path = (
                configured_path if configured_path.is_absolute() else runtime_root / configured_path
            )
            object.__setattr__(self, field_name, str(resolved_path.resolve()))
        return self


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide immutable settings instance."""

    return Settings()
