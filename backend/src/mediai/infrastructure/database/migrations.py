"""Production-safe Alembic migration orchestration."""

from pathlib import Path

from alembic import command
from alembic.config import Config
from loguru import logger

from mediai.core.config import Settings


def upgrade_database_to_head(settings: Settings) -> None:
    """Apply every pending Alembic revision before application data is queried."""
    runtime_root = Path(settings.runtime_root)
    config_path = runtime_root / "alembic.ini"
    script_path = runtime_root / "alembic"
    alembic_config = Config(str(config_path))
    alembic_config.set_main_option("script_location", str(script_path))
    alembic_config.set_main_option("sqlalchemy.url", settings.database_url.replace("%", "%%"))

    logger.info("database_migrations_started", target_revision="head")
    try:
        command.upgrade(alembic_config, "head")
    except Exception as error:
        logger.exception(
            "database_migrations_failed",
            error_type=type(error).__name__,
            error=str(error),
        )
        raise
    logger.info("database_migrations_completed", target_revision="head")
