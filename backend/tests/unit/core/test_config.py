from pathlib import Path
from typing import Any

import pytest
from pydantic import SecretStr, ValidationError

from mediai.core.config import Settings
from mediai.core.enums import Environment


def base_values() -> dict[str, Any]:
    return {
        "environment": Environment.TEST,
        "database_url": "sqlite+aiosqlite://",
        "redis_url": "redis://localhost:6379/0",
        "celery_broker_url": "redis://localhost:6379/1",
        "celery_result_backend": "redis://localhost:6379/2",
        "jwt_secret_key": SecretStr("test-secret"),
    }


def test_settings_reject_wildcard_cors_with_credentials() -> None:
    with pytest.raises(ValidationError, match="Wildcard CORS"):
        Settings(**base_values(), cors_origins=["*"])


def test_settings_reject_production_debug() -> None:
    values = base_values()
    values.update(
        environment=Environment.PRODUCTION,
        database_url="postgresql+asyncpg://user:password@localhost/mediai",
        jwt_secret_key=SecretStr("a" * 64),
        debug=True,
    )
    with pytest.raises(ValidationError, match="Debug mode"):
        Settings(**values)


def test_settings_normalize_log_level() -> None:
    settings = Settings(**base_values(), log_level="warning")
    assert settings.log_level == "WARNING"


def test_settings_resolve_ml_paths_against_runtime_root(tmp_path: Path) -> None:
    settings = Settings(**base_values(), runtime_root=str(tmp_path))

    assert settings.runtime_root == str(tmp_path.resolve())
    assert settings.ml_dataset_path == str(
        (tmp_path / "data/ml/train_disease.csv").resolve()
    )
    assert settings.ml_test_dataset_path == str((tmp_path / "data/ml/test_disease.csv").resolve())
    assert settings.ml_model_artifact_path == str(
        (tmp_path / "data/ml/disease_model.joblib").resolve()
    )
    assert settings.ml_label_encoder_path == str(
        (tmp_path / "data/ml/label_encoder.joblib").resolve()
    )
    assert settings.ml_metrics_path == str(
        (tmp_path / "data/ml/metrics.json").resolve()
    )
    assert settings.ml_reports_dir == str((tmp_path / "artifacts/reports").resolve())
