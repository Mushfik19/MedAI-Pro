import pandas as pd

from mediai.infrastructure.ml.dataset import detect_target_column, prepare_dataset


def test_detects_prognosis_and_cleans_duplicate_feature_headers() -> None:
    frame = pd.DataFrame(
        [
            [1, 0, "Condition A", None],
            [1, 0, "Condition A", None],
            [0, 1, "Condition B", None],
        ],
        columns=["skin rash", "skin_rash.1", "prognosis", "Unnamed: 3"],
    )

    assert detect_target_column(frame) == "prognosis"

    prepared = prepare_dataset(frame, drop_duplicates=True)

    assert prepared.target_name == "prognosis"
    assert prepared.target_source == "prognosis"
    assert prepared.feature_names == ("skin_rash",)
    assert prepared.feature_sources == {
        "skin_rash": ("skin rash", "skin_rash.1"),
    }
    assert prepared.original_rows == 3
    assert prepared.cleaned_rows == 2
    assert prepared.features["skin_rash"].tolist() == [1.0, 1.0]


def test_test_dataset_is_reindexed_to_training_schema() -> None:
    frame = pd.DataFrame(
        {
            "symptom_b": [1],
            "prognosis": ["Condition A"],
        }
    )

    prepared = prepare_dataset(
        frame,
        feature_names=("symptom_a", "symptom_b"),
        drop_duplicates=False,
    )

    assert prepared.features.to_dict(orient="records") == [
        {"symptom_a": 0.0, "symptom_b": 1.0}
    ]
