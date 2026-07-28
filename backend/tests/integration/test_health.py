from asgi_lifespan import LifespanManager
from httpx import ASGITransport, AsyncClient

from mediai.app.factory import create_application
from mediai.core.enums import Environment
from tests.conftest import FakeClinicalModelService, FakeRedisManager


async def test_liveness_returns_envelope_and_request_id(client: AsyncClient) -> None:
    response = await client.get(
        "/api/v1/health/live",
        headers={"X-Request-ID": "b31c7c11-cd0a-42f1-a88e-6079d35ecf44"},
    )
    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "b31c7c11-cd0a-42f1-a88e-6079d35ecf44"
    assert response.json()["data"] == {"status": "ok"}
    assert response.json()["meta"]["request_id"] == response.headers["X-Request-ID"]


async def test_readiness_checks_database_and_redis(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health/ready")
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["status"] == "ok"
    assert body["dependencies"]["database"]["status"] == "ok"
    assert body["dependencies"]["redis"]["status"] == "ok"


async def test_redis_outage_does_not_block_startup_or_readiness(
    settings,
    database,
) -> None:
    redis = FakeRedisManager(ready=False)
    application = create_application(
        settings=settings.model_copy(update={"startup_dependency_checks": True}),
        database=database,
        redis=redis,
        ml_service=FakeClinicalModelService(),
    )

    async with (
        LifespanManager(application),
        AsyncClient(
            transport=ASGITransport(app=application),
            base_url="http://testserver",
        ) as outage_client,
    ):
        live_response = await outage_client.get("/api/v1/health/live")
        ready_response = await outage_client.get("/api/v1/health/ready")
        version_response = await outage_client.get("/api/v1/health/version")

    assert live_response.status_code == 200
    assert ready_response.status_code == 200
    assert ready_response.json()["data"]["status"] == "ok"
    assert ready_response.json()["data"]["dependencies"]["redis"]["status"] == "degraded"
    assert version_response.status_code == 200
    assert redis.retry_started is True


async def test_migrations_complete_before_administrator_seeding(
    settings,
    database,
    redis_manager,
    monkeypatch,
) -> None:
    startup_events: list[str] = []
    monkeypatch.setattr(
        "mediai.app.lifespan.upgrade_database_to_head",
        lambda _settings: startup_events.append("migrated"),
    )

    async def record_seed(_application) -> None:
        startup_events.append("seeded")

    monkeypatch.setattr("mediai.app.lifespan.seed_default_administrator", record_seed)
    application = create_application(
        settings=settings.model_copy(
            update={
                "environment": Environment.LOCAL,
                "database_migrate_on_startup": True,
                "seed_default_admin": True,
            }
        ),
        database=database,
        redis=redis_manager,
        ml_service=FakeClinicalModelService(),
    )

    async with LifespanManager(application):
        assert startup_events == ["migrated", "seeded"]


async def test_version_does_not_expose_secrets(client: AsyncClient) -> None:
    response = await client.get("/api/v1/health/version")
    assert response.status_code == 200
    assert response.json()["data"] == {
        "application": "MediAI Pro Test API",
        "version": "0.1.0-test",
        "api_version": "v1",
        "environment": "test",
    }
    assert "secret" not in response.text.lower()


async def test_openapi_contains_required_application_routes(client: AsyncClient) -> None:
    response = await client.get("/openapi.json")
    paths = response.json()["paths"]
    required_paths = {
        "/api/v1/admin/analytics/summary",
        "/api/v1/admin/audit-logs",
        "/api/v1/admin/datasets",
        "/api/v1/admin/models",
        "/api/v1/admin/training-jobs",
        "/api/v1/admin/users",
        "/api/v1/auth/change-password",
        "/api/v1/auth/forgot-password",
        "/api/v1/auth/login",
        "/api/v1/auth/admin/login",
        "/api/v1/admin/analytics/summary",
        "/api/v1/admin/assessments",
        "/api/v1/admin/chats",
        "/api/v1/admin/system-health",
        "/api/v1/admin/users",
        "/api/v1/admin/users/{user_id}",
        "/api/v1/auth/logout",
        "/api/v1/auth/me",
        "/api/v1/auth/refresh",
        "/api/v1/auth/register",
        "/api/v1/auth/reset-password",
        "/api/v1/auth/sessions",
        "/api/v1/catalog/symptoms",
        "/api/v1/chat/conversations",
        "/api/v1/chat/conversations/{conversation_id}",
        "/api/v1/chat/conversations/{conversation_id}/messages",
        "/api/v1/clinical/analytics",
        "/api/v1/clinical/audit-logs",
        "/api/v1/clinical/chat",
        "/api/v1/clinical/dashboard",
        "/api/v1/clinical/doctors",
        "/api/v1/clinical/notifications",
        "/api/v1/clinical/predictions",
        "/api/v1/clinical/predictions/history",
        "/api/v1/clinical/reports/{prediction_id}",
        "/api/v1/clinical/reports/{report_id}/download",
        "/api/v1/clinical/settings",
        "/api/v1/dashboard/disease-frequency",
        "/api/v1/dashboard/reports/weekly",
        "/api/v1/dashboard/summary",
        "/api/v1/dashboard/trends",
        "/api/v1/doctor/dashboard",
        "/api/v1/doctor/patients",
        "/api/v1/doctor/predictions/{prediction_id}/notes",
        "/api/v1/doctor/reports/{prediction_id}",
        "/api/v1/health/live",
        "/api/v1/health/ready",
        "/api/v1/health/version",
        "/api/v1/predictions",
        "/api/v1/predictions/{prediction_id}",
        "/api/v1/predictions/reports/{report_id}/download",
        "/api/v1/predictions/{prediction_id}/report",
        "/api/v1/users/me",
        "/api/v1/users/me/data-export",
        "/api/v1/users/me/deletion-request",
        "/api/v1/users/me/profile",
        "/api/v1/users/me/settings",
    }
    assert required_paths <= set(paths)
    assert "OAuth2PasswordBearer" in response.json()["components"]["securitySchemes"]
