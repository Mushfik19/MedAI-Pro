"""Rate-limit middleware integration tests."""

from collections.abc import AsyncIterator

from asgi_lifespan import LifespanManager
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from mediai.app.factory import create_application
from mediai.core.config import Settings
from mediai.infrastructure.database import DatabaseManager
from mediai.infrastructure.redis import RedisManager
from tests.conftest import FakeClinicalModelService


async def rate_limited_client(
    settings: Settings,
    database: DatabaseManager,
    redis: RedisManager,
) -> AsyncIterator[AsyncClient]:
    application: FastAPI = create_application(
        settings=settings.model_copy(
            update={
                "rate_limit_enabled": True,
                "rate_limit_requests": 2,
                "rate_limit_window_seconds": 60,
            }
        ),
        database=database,
        redis=redis,
        ml_service=FakeClinicalModelService(),
    )
    async with (
        LifespanManager(application),
        AsyncClient(
            transport=ASGITransport(app=application),
            base_url="http://testserver",
        ) as client,
    ):
        yield client


async def test_allowed_request_receives_rate_limit_headers(
    settings: Settings,
    database: DatabaseManager,
    redis_manager: RedisManager,
) -> None:
    async for client in rate_limited_client(settings, database, redis_manager):
        response = await client.get("/api/v1/health/version")

    assert response.status_code == 200
    assert response.headers["x-ratelimit-limit"] == "2"
    assert response.headers["x-ratelimit-remaining"] == "1"


async def test_rejected_request_uses_problem_details(
    settings: Settings,
    database: DatabaseManager,
    redis_manager: RedisManager,
) -> None:
    async def reject(*_args: object) -> list[int]:
        return [3, 60]

    redis_manager.client.eval = reject
    async for client in rate_limited_client(settings, database, redis_manager):
        response = await client.get("/api/v1/health/version")

    assert response.status_code == 429
    assert response.headers["content-type"].startswith("application/problem+json")
    assert response.headers["retry-after"] == "60"
    assert response.json()["code"] == "RATE_LIMITED"
