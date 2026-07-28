"""Framework-independent repository ports used by application services."""

from typing import Protocol
from uuid import UUID


class ReadRepository[ModelT](Protocol):
    """Minimum persistence contract required by lookup-oriented services."""

    model_type: type[ModelT]

    async def get_by_id(self, entity_id: UUID) -> ModelT | None:
        """Return an entity by its stable identifier when it exists."""
