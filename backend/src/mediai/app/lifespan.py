"""Application startup and shutdown orchestration."""

import asyncio
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from loguru import logger

from mediai.features.auth.seed import seed_default_administrator


@asynccontextmanager
async def application_lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = app.state.settings
    database = app.state.database
    redis = app.state.redis
    ml_service = app.state.ml_service

    try:
        if settings.startup_dependency_checks:
            database_ready, redis_ready = await asyncio.gather(database.ping(), redis.ping())
            if not database_ready or not redis_ready:
                raise RuntimeError("Required startup dependencies are unavailable")

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
