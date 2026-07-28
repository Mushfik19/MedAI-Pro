"""Train and evaluate the disease classifier from the configured CSV files."""

from __future__ import annotations

import json

from mediai.core.config import get_settings
from mediai.infrastructure.ml.service import ClinicalModelService


def main() -> None:
    service = ClinicalModelService(get_settings())
    bundle = service.train_and_export()
    print(json.dumps(bundle.metrics, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
