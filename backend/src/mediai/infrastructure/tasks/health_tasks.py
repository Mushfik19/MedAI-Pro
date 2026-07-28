"""Operational tasks used to verify worker availability."""

from mediai.infrastructure.tasks.celery_app import celery_app


@celery_app.task(name="mediai.health.ping")  # type: ignore[misc]
def worker_ping() -> dict[str, str]:
    return {"status": "ok"}
