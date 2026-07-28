from pathlib import Path
from typing import Any

from mediai.infrastructure.ml.service import ClinicalModelService


def test_service_creates_missing_storage_directories(tmp_path: Path) -> None:
    settings: Any = type(
        "ModelSettings",
        (),
        {
            "ml_model_artifact_path": str(tmp_path / "artifacts/ml/model.joblib"),
            "ml_metrics_path": str(tmp_path / "artifacts/ml/metrics.json"),
            "ml_dataset_path": str(tmp_path / "data/ml/dataset.csv"),
            "ml_reports_dir": str(tmp_path / "artifacts/reports"),
        },
    )()

    service = ClinicalModelService(settings)

    assert service.bundle is None
    assert service.artifact_path.parent.is_dir()
    assert service.metrics_path.parent.is_dir()
    assert service.report_dir.is_dir()
