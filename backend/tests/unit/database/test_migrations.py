"""Migration startup guarantees."""

from pathlib import Path
from unittest.mock import Mock

from mediai.core.config import Settings
from mediai.infrastructure.database.migrations import upgrade_database_to_head


def test_upgrade_database_targets_alembic_head(
    settings: Settings,
    monkeypatch,
    tmp_path: Path,
) -> None:
    (tmp_path / "alembic.ini").touch()
    command_upgrade = Mock()
    monkeypatch.setattr(
        "mediai.infrastructure.database.migrations.command.upgrade",
        command_upgrade,
    )
    deployment_settings = settings.model_copy(update={"runtime_root": str(tmp_path)})

    upgrade_database_to_head(deployment_settings)

    alembic_config, revision = command_upgrade.call_args.args
    assert revision == "head"
    assert alembic_config.get_main_option("script_location") == str(tmp_path / "alembic")
    assert alembic_config.get_main_option("sqlalchemy.url") == settings.database_url
