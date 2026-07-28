"""Async SQLAlchemy repository foundation."""

from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from mediai.infrastructure.database.models import Base


class BaseRepository[ModelT: Base]:
    """Typed async repository for common persistence operations."""

    def __init__(self, session: AsyncSession, model_type: type[ModelT]) -> None:
        self.session = session
        self.model_type = model_type

    def base_query(self) -> Select[tuple[ModelT]]:
        return select(self.model_type)

    async def get_by_id(self, entity_id: UUID) -> ModelT | None:
        return await self.session.get(self.model_type, entity_id)

    async def list(self, *, limit: int, offset: int = 0) -> Sequence[ModelT]:
        statement = self.base_query().limit(limit).offset(offset)
        return (await self.session.scalars(statement)).all()

    async def count(self) -> int:
        statement = select(func.count()).select_from(self.model_type)
        return int(await self.session.scalar(statement) or 0)

    async def add(self, entity: ModelT) -> ModelT:
        self.session.add(entity)
        await self.session.flush()
        return entity

    async def delete(self, entity: ModelT) -> None:
        await self.session.delete(entity)
        await self.session.flush()
