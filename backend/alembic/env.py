"""Async Alembic migration environment."""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import Connection, pool, text
from sqlalchemy.ext.asyncio import async_engine_from_config

from mediai.core.config import get_settings
from mediai.features.auth import models as auth_models
from mediai.infrastructure.database import clinical_models as clinical_models
from mediai.infrastructure.database.models import Base

_ = auth_models
_ = clinical_models

config = context.config
if config.config_file_name is not None:
    fileConfig(config.config_file_name, disable_existing_loggers=False)

settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    context.configure(
        url=settings.database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def run_sync_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
        render_as_batch=False,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    try:
        async with connectable.connect() as connection:
            uses_postgresql = connection.dialect.name == "postgresql"
            if uses_postgresql:
                # Serialize Alembic across concurrently starting API instances.
                await connection.execute(text("SELECT pg_advisory_lock(672349822)"))
                await connection.commit()
            try:
                await connection.run_sync(run_sync_migrations)
            finally:
                if uses_postgresql:
                    await connection.execute(text("SELECT pg_advisory_unlock(672349822)"))
                    await connection.commit()
    finally:
        await connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
