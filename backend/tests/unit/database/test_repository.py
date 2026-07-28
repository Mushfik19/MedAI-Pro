from unittest.mock import AsyncMock
from uuid import uuid4

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from mediai.infrastructure.database.models import Base, UUIDPrimaryKeyMixin
from mediai.shared.infrastructure.base_repository import BaseRepository


class RepositoryEntity(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "test_repository_entities"

    name: Mapped[str] = mapped_column()


async def test_base_repository_adds_and_reads_by_id() -> None:
    entity_id = uuid4()
    entity = RepositoryEntity(id=entity_id, name="MediAI")
    session = AsyncMock(spec=AsyncSession)
    session.get.return_value = entity
    repository = BaseRepository(session, RepositoryEntity)

    added = await repository.add(entity)
    loaded = await repository.get_by_id(entity_id)

    assert added is entity
    assert loaded is entity
    session.add.assert_called_once_with(entity)
    session.flush.assert_awaited_once()
    session.get.assert_awaited_once_with(RepositoryEntity, entity_id)
