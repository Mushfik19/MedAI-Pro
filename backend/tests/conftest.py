"""Deterministic async test infrastructure."""

from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

import pytest
from asgi_lifespan import LifespanManager
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from pydantic import SecretStr

from mediai.app.factory import create_application
from mediai.core.config import Settings
from mediai.core.enums import Environment
from mediai.infrastructure.database import DatabaseManager
from mediai.infrastructure.ml.service import ClinicalModelService
from mediai.infrastructure.redis import RedisManager


class FakeRedisClient:
    async def eval(self, _script: str, _keys: int, *_args: object) -> list[int]:
        return [1, 60]


class FakeRedisManager(RedisManager):
    def __init__(self, *, ready: bool = True) -> None:
        self.client: Any = FakeRedisClient()
        self.ready = ready
        self.available = ready
        self.closed = False
        self.retry_started = False

    async def ping(self) -> bool:
        self.available = self.ready
        return self.ready

    def start_background_retry(self) -> None:
        self.retry_started = True

    def mark_unavailable(self) -> None:
        self.available = False
        self.retry_started = True

    async def close(self) -> None:
        self.closed = True


class FakeDatabaseManager(DatabaseManager):
    def __init__(self, *, ready: bool = True) -> None:
        self.ready = ready
        self.disposed = False

    async def ping(self) -> bool:
        return self.ready

    async def dispose(self) -> None:
        self.disposed = True


class FakeClinicalModelService(ClinicalModelService):
    def __init__(self) -> None:
        self.initialized = False

    def initialize(self) -> None:
        self.initialized = True


@pytest.fixture
def settings(ml_runtime_root: Path) -> Settings:
    return Settings(
        environment=Environment.TEST,
        app_name="MediAI Pro Test API",
        app_version="0.1.0-test",
        database_url="sqlite+aiosqlite://",
        redis_url="redis://localhost:6379/0",
        celery_broker_url="redis://localhost:6379/1",
        celery_result_backend="redis://localhost:6379/2",
        jwt_secret_key=SecretStr("test-only-secret-" * 8),
        rate_limit_enabled=False,
        startup_dependency_checks=False,
        log_level="ERROR",
        docs_enabled=True,
        runtime_root=str(ml_runtime_root),
    )


@pytest.fixture(scope="session")
def ml_runtime_root(tmp_path_factory: pytest.TempPathFactory) -> Path:
    return tmp_path_factory.mktemp("mediai-runtime")


@pytest.fixture
def database() -> FakeDatabaseManager:
    return FakeDatabaseManager()


@pytest.fixture
def redis_manager() -> FakeRedisManager:
    return FakeRedisManager()


@pytest.fixture
async def app(
    settings: Settings,
    database: FakeDatabaseManager,
    redis_manager: FakeRedisManager,
) -> AsyncIterator[FastAPI]:
    application = create_application(
        settings=settings,
        database=database,
        redis=redis_manager,
        ml_service=FakeClinicalModelService(),
    )
    async with LifespanManager(application):
        yield application


@pytest.fixture
async def client(app: FastAPI) -> AsyncIterator[AsyncClient]:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://testserver",
    ) as test_client:
        yield test_client
