"""Base service abstraction for feature application services."""

from uuid import UUID

from mediai.shared.domain.exceptions import ResourceNotFoundError
from mediai.shared.domain.repository import ReadRepository


class BaseService[ModelT]:
    """Reusable orchestration behavior without embedding feature business rules."""

    def __init__(self, repository: ReadRepository[ModelT]) -> None:
        self.repository = repository

    async def get_or_fail(self, entity_id: UUID) -> ModelT:
        entity = await self.repository.get_by_id(entity_id)
        if entity is None:
            raise ResourceNotFoundError(self.repository.model_type.__name__)
        return entity
