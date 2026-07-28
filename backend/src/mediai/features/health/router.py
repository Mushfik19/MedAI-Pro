"""Versioned operational health endpoints."""

from datetime import UTC, datetime

from fastapi import APIRouter, Request, Response, status

from mediai.core.config import Settings
from mediai.core.enums import HealthStatus
from mediai.features.health.schemas import (
    LivenessResponse,
    ReadinessResponse,
    VersionResponse,
)
from mediai.features.health.service import HealthService
from mediai.shared.presentation.responses import envelope
from mediai.shared.presentation.schemas import ApiResponse, ResponseMeta

router = APIRouter(prefix="/health", tags=["Health"])


@router.get(
    "/live",
    summary="Process liveness",
)
async def liveness(request: Request) -> ApiResponse[LivenessResponse]:
    return envelope(LivenessResponse(status=HealthStatus.OK), request.state.request_id)


@router.get(
    "/ready",
    summary="Infrastructure readiness",
)
async def readiness(request: Request, response: Response) -> ApiResponse[ReadinessResponse]:
    service = HealthService(
        database_ping=request.app.state.database.ping,
        redis_ping=request.app.state.redis.ping,
    )
    result = await service.readiness()
    if result.status is HealthStatus.DEGRADED:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return ApiResponse(
        data=result,
        meta=ResponseMeta(
            request_id=request.state.request_id,
            timestamp=datetime.now(UTC),
        ),
    )


@router.get(
    "/version",
    summary="Application version",
)
async def version(request: Request) -> ApiResponse[VersionResponse]:
    settings: Settings = request.app.state.settings
    return envelope(
        VersionResponse(
            application=settings.app_name,
            version=settings.app_version,
            api_version="v1",
            environment=settings.environment.value,
        ),
        request.state.request_id,
    )
