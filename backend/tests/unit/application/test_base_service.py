"""Base service behavior tests."""

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from mediai.shared.application.base_service import BaseService
from mediai.shared.domain.exceptions import ResourceNotFoundError


async def test_get_or_fail_returns_repository_entity() -> None:
    entity = object()
    repository = AsyncMock()
    repository.get_by_id.return_value = entity
    service = BaseService(repository)

    assert await service.get_or_fail(uuid4()) is entity


async def test_get_or_fail_raises_typed_not_found_error() -> None:
    repository = AsyncMock()
    repository.get_by_id.return_value = None
    repository.model_type = type("PatientRecord", (), {})
    service = BaseService(repository)

    with pytest.raises(ResourceNotFoundError) as error:
        await service.get_or_fail(uuid4())

    assert error.value.code == "NOT_FOUND"
