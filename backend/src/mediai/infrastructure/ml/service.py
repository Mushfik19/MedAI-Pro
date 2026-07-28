"""Training, artifact export, loading, and inference for the Kaggle disease model."""

from __future__ import annotations

import json
import re
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    log_loss,
    precision_score,
    recall_score,
    top_k_accuracy_score,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBClassifier

from mediai.core.config import Settings
from mediai.infrastructure.ml.catalog import DISEASE_PROFILE_BY_CODE
from mediai.infrastructure.ml.dataset import load_dataset, normalize_column_name
from mediai.shared.domain.exceptions import DatasetUnavailableError, ModelUnavailableError


@dataclass(frozen=True, slots=True)
class ModelBundle:
    pipeline: Pipeline
    label_encoder: LabelEncoder
    feature_names: tuple[str, ...]
    metrics: dict[str, object]
    class_distribution: dict[str, int]
    model_version: str
    trained_at: datetime


class ClinicalModelService:
    """Own the reproducible training lifecycle and runtime inference path."""

    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.artifact_path = Path(settings.ml_model_artifact_path)
        self.label_encoder_path = Path(
            getattr(
                settings,
                "ml_label_encoder_path",
                self.artifact_path.with_name("label_encoder.joblib"),
            )
        )
        self.metrics_path = Path(settings.ml_metrics_path)
        self.dataset_path = Path(settings.ml_dataset_path)
        self.test_dataset_path = Path(
            getattr(
                settings,
                "ml_test_dataset_path",
                self.dataset_path.with_name("test_disease.csv"),
            )
        )
        self.report_dir = Path(settings.ml_reports_dir)
        self._ensure_storage_directories()
        self.bundle: ModelBundle | None = None

    def initialize(self) -> None:
        if self.bundle is None:
            self.bundle = self._load_or_train_bundle()

    def _ensure_storage_directories(self) -> None:
        for directory in {
            self.artifact_path.parent,
            self.label_encoder_path.parent,
            self.metrics_path.parent,
            self.report_dir,
        }:
            directory.mkdir(parents=True, exist_ok=True)

    def _load_or_train_bundle(self) -> ModelBundle:
        required = (self.artifact_path, self.label_encoder_path, self.metrics_path)
        if all(path.is_file() for path in required):
            return self._load_bundle()
        if not self.settings.ml_auto_train_on_startup:
            raise ModelUnavailableError("The trained disease model artifacts are incomplete.")
        return self.train_and_export()

    def _load_bundle(self) -> ModelBundle:
        pipeline = joblib.load(self.artifact_path)
        label_encoder = joblib.load(self.label_encoder_path)
        metrics = json.loads(self.metrics_path.read_text(encoding="utf-8"))
        if not isinstance(pipeline, Pipeline) or not isinstance(label_encoder, LabelEncoder):
            raise ModelUnavailableError("The disease model artifacts have incompatible types.")
        feature_names = tuple(str(item) for item in metrics.get("feature_names", ()))
        if not feature_names:
            raise ModelUnavailableError(
                "The model metrics do not contain the training feature schema."
            )
        trained_at = datetime.fromisoformat(str(metrics["trained_at"]))
        return ModelBundle(
            pipeline=pipeline,
            label_encoder=label_encoder,
            feature_names=feature_names,
            metrics=metrics,
            class_distribution={
                str(key): int(value)
                for key, value in dict(metrics.get("class_distribution", {})).items()
            },
            model_version=str(metrics["model_version"]),
            trained_at=trained_at,
        )

    def train_and_export(self) -> ModelBundle:
        train = load_dataset(self.dataset_path, drop_duplicates=True)
        test = load_dataset(
            self.test_dataset_path,
            feature_names=train.feature_names,
            drop_duplicates=False,
        )
        label_encoder = LabelEncoder()
        y_train = label_encoder.fit_transform(train.target)
        unknown_test_labels = sorted(set(test.target) - set(label_encoder.classes_))
        if unknown_test_labels:
            raise DatasetUnavailableError(
                f"Test data contains labels absent from training: {unknown_test_labels}"
            )
        y_test = label_encoder.transform(test.target)

        pipeline = Pipeline(
            steps=[
                ("imputer", SimpleImputer(strategy="median")),
                (
                    "model",
                    XGBClassifier(
                        objective="multi:softprob",
                        eval_metric="mlogloss",
                        n_estimators=300,
                        max_depth=6,
                        learning_rate=0.05,
                        subsample=0.9,
                        colsample_bytree=0.9,
                        min_child_weight=1,
                        reg_lambda=1.0,
                        random_state=self.settings.ml_random_state,
                        tree_method="hist",
                        n_jobs=1,
                    ),
                ),
            ]
        )
        pipeline.fit(train.features, y_train)
        predicted = pipeline.predict(test.features)
        probabilities = pipeline.predict_proba(test.features)
        now = datetime.now(UTC)
        model_version = f"kaggle-xgb-{now.strftime('%Y%m%d%H%M%S')}"
        metrics: dict[str, object] = {
            "accuracy": round(float(accuracy_score(y_test, predicted)), 6),
            "precision_macro": round(
                float(precision_score(y_test, predicted, average="macro", zero_division=0)),
                6,
            ),
            "recall_macro": round(
                float(recall_score(y_test, predicted, average="macro", zero_division=0)),
                6,
            ),
            "f1_macro": round(
                float(f1_score(y_test, predicted, average="macro", zero_division=0)),
                6,
            ),
            "precision_weighted": round(
                float(precision_score(y_test, predicted, average="weighted", zero_division=0)),
                6,
            ),
            "recall_weighted": round(
                float(recall_score(y_test, predicted, average="weighted", zero_division=0)),
                6,
            ),
            "f1_weighted": round(
                float(f1_score(y_test, predicted, average="weighted", zero_division=0)),
                6,
            ),
            "top_5_accuracy": round(
                float(
                    top_k_accuracy_score(
                        y_test,
                        probabilities,
                        k=min(5, probabilities.shape[1]),
                        labels=np.arange(len(label_encoder.classes_)),
                    )
                ),
                6,
            ),
            "log_loss": round(
                float(
                    log_loss(
                        y_test,
                        probabilities,
                        labels=np.arange(len(label_encoder.classes_)),
                    )
                ),
                6,
            ),
            "train_rows_original": train.original_rows,
            "train_rows_cleaned": train.cleaned_rows,
            "test_rows": test.cleaned_rows,
            "feature_count": len(train.feature_names),
            "class_count": len(label_encoder.classes_),
            "target_column": train.target_name,
            "target_source_column": train.target_source,
            "feature_names": list(train.feature_names),
            "feature_sources": {
                feature: list(train.feature_sources[feature])
                for feature in train.feature_names
            },
            "class_distribution": {
                str(label): int(count)
                for label, count in train.target.value_counts().sort_index().items()
            },
            "model_version": model_version,
            "trained_at": now.isoformat(),
        }
        self._atomic_joblib_dump(pipeline, self.artifact_path)
        self._atomic_joblib_dump(label_encoder, self.label_encoder_path)
        temporary_metrics = self.metrics_path.with_suffix(".json.tmp")
        temporary_metrics.write_text(
            json.dumps(metrics, indent=2, sort_keys=True),
            encoding="utf-8",
        )
        temporary_metrics.replace(self.metrics_path)
        bundle = ModelBundle(
            pipeline=pipeline,
            label_encoder=label_encoder,
            feature_names=train.feature_names,
            metrics=metrics,
            class_distribution=dict(metrics["class_distribution"]),
            model_version=model_version,
            trained_at=now,
        )
        self.bundle = bundle
        return bundle

    @staticmethod
    def _atomic_joblib_dump(value: object, destination: Path) -> None:
        temporary = destination.with_suffix(f"{destination.suffix}.tmp")
        joblib.dump(value, temporary)
        temporary.replace(destination)

    def predict(self, payload: dict[str, float]) -> dict[str, object]:
        if self.bundle is None:
            raise ModelUnavailableError()
        normalized_payload = {
            normalize_column_name(key): float(value) for key, value in payload.items()
        }
        frame = pd.DataFrame(
            [[normalized_payload.get(feature, 0.0) for feature in self.bundle.feature_names]],
            columns=self.bundle.feature_names,
            dtype="float32",
        )
        probabilities = self.bundle.pipeline.predict_proba(frame)[0]
        top_indices = np.argsort(probabilities)[::-1][:5]
        labels = self.bundle.label_encoder.inverse_transform(top_indices)
        candidates = [
            {
                "code": self._disease_code(str(label)),
                "name": str(label),
                "probability": round(float(probabilities[index]), 6),
                "severity": self._profile_value(str(label), "severity", "MODERATE"),
                "specialty": self._profile_value(str(label), "specialty", "Primary Care"),
            }
            for index, label in zip(top_indices, labels, strict=True)
        ]
        primary = candidates[0]
        probability = float(primary["probability"])
        return {
            "primary_disease_code": primary["code"],
            "primary_disease_name": primary["name"],
            "top_diseases": candidates,
            "probability": probability,
            "confidence": probability,
            "severity": primary["severity"],
            "explanation": self._build_explanations(frame.iloc[0], probability),
            "model_version": self.bundle.model_version,
        }

    @staticmethod
    def _disease_code(label: str) -> str:
        return re.sub(r"[^a-z0-9]+", "_", label.casefold()).strip("_")

    def _profile_value(self, label: str, field: str, default: str) -> str:
        profile = DISEASE_PROFILE_BY_CODE.get(self._disease_code(label))
        if profile is None:
            return default
        value = getattr(profile, field)
        return str(value.value if hasattr(value, "value") else value)

    @staticmethod
    def _build_explanations(row: pd.Series, probability: float) -> list[dict[str, object]]:
        active = row[row > 0].sort_values(ascending=False).head(5)
        return [
            {
                "feature": str(feature),
                "impact": round(float(value), 4),
                "rationale": (
                    f"The reported symptom '{str(feature).replace('_', ' ')}' "
                    "contributed to the model input."
                ),
                "confidence_context": round(probability, 6),
            }
            for feature, value in active.items()
        ]

    def disease_profile(self, disease_code: str) -> dict[str, object]:
        profile = DISEASE_PROFILE_BY_CODE.get(disease_code)
        if profile is not None:
            return {
                "code": profile.code,
                "name": profile.name,
                "severity": profile.severity.value,
                "specialty": profile.specialty,
                "description": profile.description,
                "triage_guidance": profile.triage_guidance,
                "recommended_labs": list(profile.recommended_labs),
                "recommended_specialists": list(profile.recommended_specialists),
                "lifestyle_advice": list(profile.lifestyle_advice),
            }
        if self.bundle is None:
            raise ModelUnavailableError()
        label_by_code = {
            self._disease_code(str(label)): str(label)
            for label in self.bundle.label_encoder.classes_
        }
        name = label_by_code.get(disease_code)
        if name is None:
            raise ModelUnavailableError(f"Unknown disease code: {disease_code}")
        return {
            "code": disease_code,
            "name": name,
            "severity": "MODERATE",
            "specialty": "Primary Care",
            "description": (
                "The trained classifier identified symptom patterns "
                f"associated with {name}."
            ),
            "triage_guidance": (
                "Discuss the result with a qualified clinician for diagnosis and treatment."
            ),
            "recommended_labs": [],
            "recommended_specialists": ["Primary Care"],
            "lifestyle_advice": ["Seek professional medical advice if symptoms persist or worsen."],
        }

    def feature_names(self) -> tuple[str, ...]:
        if self.bundle is None:
            raise ModelUnavailableError()
        return self.bundle.feature_names
