"""Schema detection and deterministic cleaning for disease-classification datasets."""

from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path

import pandas as pd

from mediai.shared.domain.exceptions import DatasetUnavailableError

TARGET_CANDIDATES = ("prognosis", "disease_code", "disease", "diagnosis", "target", "label")


@dataclass(frozen=True, slots=True)
class PreparedDataset:
    features: pd.DataFrame
    target: pd.Series
    feature_names: tuple[str, ...]
    feature_sources: dict[str, tuple[str, ...]]
    target_name: str
    target_source: str
    original_rows: int
    cleaned_rows: int


def normalize_column_name(value: object) -> str:
    """Convert inconsistent Kaggle headers into stable API/model feature codes."""
    normalized = str(value).strip().lower()
    normalized = re.sub(r"\.\d+$", "", normalized)
    normalized = re.sub(r"[^a-z0-9]+", "_", normalized)
    return normalized.strip("_")


def detect_target_column(frame: pd.DataFrame) -> str:
    normalized = {normalize_column_name(column): str(column) for column in frame.columns}
    for candidate in TARGET_CANDIDATES:
        if candidate in normalized:
            return normalized[candidate]
    non_numeric = [
        str(column)
        for column in frame.columns
        if not pd.api.types.is_numeric_dtype(frame[column])
    ]
    if len(non_numeric) == 1:
        return non_numeric[0]
    raise DatasetUnavailableError(
        "Unable to detect the target column. Expected prognosis, disease, "
        "diagnosis, target, or label."
    )


def _merge_duplicate_features(
    frame: pd.DataFrame,
) -> tuple[pd.DataFrame, dict[str, tuple[str, ...]]]:
    merged: dict[str, pd.Series] = {}
    sources: dict[str, list[str]] = {}
    for index, column in enumerate(frame.columns):
        name = normalize_column_name(column)
        if not name or name.startswith("unnamed"):
            continue
        source_name = str(column)
        sources.setdefault(name, []).append(source_name)
        values = frame.iloc[:, index]
        if name in merged:
            existing = pd.to_numeric(merged[name], errors="coerce")
            incoming = pd.to_numeric(values, errors="coerce")
            merged[name] = pd.concat([existing, incoming], axis=1).max(axis=1)
        else:
            merged[name] = values
    return pd.DataFrame(merged), {
        name: tuple(source_names) for name, source_names in sources.items()
    }


def prepare_dataset(
    frame: pd.DataFrame,
    *,
    target_column: str | None = None,
    feature_names: tuple[str, ...] | None = None,
    drop_duplicates: bool,
) -> PreparedDataset:
    if frame.empty:
        raise DatasetUnavailableError("The disease dataset is empty.")
    original_rows = len(frame)
    detected_target = target_column or detect_target_column(frame)
    normalized_target = normalize_column_name(detected_target)
    cleaned, feature_sources = _merge_duplicate_features(frame)
    if normalized_target not in cleaned:
        raise DatasetUnavailableError(
            f"Target column '{detected_target}' is missing after cleaning."
        )

    target = cleaned.pop(normalized_target).astype("string").str.strip()
    valid_target = target.notna() & target.ne("")
    cleaned = cleaned.loc[valid_target].copy()
    target = target.loc[valid_target].astype(str)

    for column in cleaned.columns:
        cleaned[column] = pd.to_numeric(cleaned[column], errors="coerce")
    if feature_names is None:
        selected_features = tuple(cleaned.columns)
    else:
        selected_features = feature_names
        cleaned = cleaned.reindex(columns=selected_features)
    cleaned = cleaned.fillna(cleaned.median(numeric_only=True)).fillna(0.0)
    cleaned = cleaned.astype("float32")

    combined = cleaned.copy()
    combined[normalized_target] = target.to_numpy()
    if drop_duplicates:
        combined = combined.drop_duplicates()
    combined = combined.reset_index(drop=True)
    return PreparedDataset(
        features=combined.loc[:, list(selected_features)],
        target=combined[normalized_target],
        feature_names=selected_features,
        feature_sources={
            feature: feature_sources.get(feature, (feature,)) for feature in selected_features
        },
        target_name=normalized_target,
        target_source=str(detected_target),
        original_rows=original_rows,
        cleaned_rows=len(combined),
    )


def load_dataset(
    path: str | Path,
    *,
    feature_names: tuple[str, ...] | None = None,
    drop_duplicates: bool,
) -> PreparedDataset:
    dataset_path = Path(path)
    if not dataset_path.is_file():
        raise DatasetUnavailableError(f"Dataset file does not exist: {dataset_path}")
    return prepare_dataset(
        pd.read_csv(dataset_path),
        feature_names=feature_names,
        drop_duplicates=drop_duplicates,
    )


def clean_training_frame(frame: pd.DataFrame) -> pd.DataFrame:
    """Compatibility helper used by administrator dataset validation."""
    prepared = prepare_dataset(frame, drop_duplicates=True)
    cleaned = prepared.features.copy()
    cleaned[prepared.target_name] = prepared.target
    return cleaned
