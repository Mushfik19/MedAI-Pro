"""Health endpoint response contracts."""

from pydantic import BaseModel, ConfigDict

from mediai.core.enums import HealthStatus


class DependencyHealth(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: HealthStatus
    latency_ms: float


class LivenessResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: HealthStatus


class ReadinessResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: HealthStatus
    dependencies: dict[str, DependencyHealth]


class VersionResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    application: str
    version: str
    api_version: str
    environment: str
