"""Celery application configured from the shared environment layer."""

from celery import Celery

from mediai.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "mediai",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
    include=["mediai.infrastructure.tasks.health_tasks"],
)
celery_app.conf.update(
    accept_content=["json"],
    broker_connection_retry_on_startup=True,
    enable_utc=True,
    result_expires=3_600,
    task_acks_late=True,
    task_reject_on_worker_lost=True,
    task_serializer="json",
    result_serializer="json",
    timezone="UTC",
    worker_prefetch_multiplier=1,
)
