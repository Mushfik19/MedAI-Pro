"""Async engine, session factory, and transaction lifecycle."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.pool import StaticPool

from mediai.core.config import Settings


class DatabaseManager:
    """Own the async SQLAlchemy engine and session factory."""

    def __init__(self, settings: Settings) -> None:
        engine_options: dict[str, object] = {
            "echo": settings.debug,
            "pool_pre_ping": True,
        }
        if settings.database_url.startswith("sqlite+aiosqlite://"):
            engine_options["poolclass"] = StaticPool
            engine_options["connect_args"] = {"check_same_thread": False}
        else:
            engine_options.update(
                pool_size=settings.database_pool_size,
                max_overflow=settings.database_max_overflow,
                pool_recycle=settings.database_pool_recycle_seconds,
            )

        self.engine: AsyncEngine = create_async_engine(settings.database_url, **engine_options)
        self.session_factory = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            autoflush=False,
            expire_on_commit=False,
        )

    @asynccontextmanager
    async def session(self) -> AsyncIterator[AsyncSession]:
        async with self.session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise

    async def ping(self) -> bool:
        async with self.engine.connect() as connection:
            await connection.execute(text("SELECT 1"))
        return True

    async def dispose(self) -> None:
        await self.engine.dispose()
