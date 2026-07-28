"""Application startup and shutdown orchestration."""

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from loguru import logger

from mediai.core.enums import Environment
from mediai.features.auth.seed import seed_default_administrator
from mediai.infrastructure.database.migrations import upgrade_database_to_head


@asynccontextmanager
async def application_lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = app.state.settings
    database = app.state.database
    redis = app.state.redis
    ml_service = app.state.ml_service

    try:
        if (
            settings.database_migrate_on_startup
            and settings.environment is not Environment.TEST
        ):
            await asyncio.to_thread(upgrade_database_to_head, settings)

        if settings.startup_dependency_checks and not await database.ping():
            raise RuntimeError("Required database dependency is unavailable")

        redis_ready = await redis.ping()
        if not redis_ready:
            logger.warning(
                "redis_unavailable_at_startup",
                detail="Redis-dependent features are temporarily disabled",
            )
            redis.start_background_retry()

        await seed_default_administrator(app)
        await asyncio.to_thread(ml_service.initialize)

        logger.info(
            "application_started",
            environment=settings.environment.value,
            version=settings.app_version,
        )
        yield
    finally:
        await asyncio.gather(database.dispose(), redis.close())
        logger.info("application_stopped")
