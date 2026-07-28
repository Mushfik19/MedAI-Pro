"""Async persistence operations for authentication transactions."""

from collections.abc import Sequence
from datetime import datetime
from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from mediai.core.enums import UserRole, VerificationPurpose
from mediai.features.auth.models import (
    AuditLog,
    RefreshSession,
    Role,
    User,
    VerificationToken,
)


class AuthRepository:
    """Own authentication queries while transaction boundaries remain external."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_role(self, role: UserRole) -> Role | None:
        statement = select(Role).where(Role.name == role).options(selectinload(Role.permissions))
        return (await self.session.execute(statement)).scalar_one_or_none()

    async def get_user_by_email(self, email: str) -> User | None:
        statement = (
            select(User)
            .where(User.email == email)
            .options(selectinload(User.role).selectinload(Role.permissions))
        )
        return (await self.session.execute(statement)).scalar_one_or_none()

    async def get_user_by_username(self, username: str) -> User | None:
        statement = (
            select(User)
            .where(User.username == username)
            .options(selectinload(User.role).selectinload(Role.permissions))
        )
        return (await self.session.execute(statement)).scalar_one_or_none()

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        statement = (
            select(User)
            .where(User.id == user_id)
            .options(selectinload(User.role).selectinload(Role.permissions))
        )
        return (await self.session.execute(statement)).scalar_one_or_none()

    async def add_user(self, user: User) -> User:
        self.session.add(user)
        await self.session.flush()
        return user

    async def get_session_for_update(self, session_id: UUID) -> RefreshSession | None:
        statement = select(RefreshSession).where(RefreshSession.id == session_id).with_for_update()
        return (await self.session.execute(statement)).scalar_one_or_none()

    async def get_session(self, session_id: UUID) -> RefreshSession | None:
        return await self.session.get(RefreshSession, session_id)

    async def add_session(self, session: RefreshSession) -> RefreshSession:
        self.session.add(session)
        await self.session.flush()
        return session

    async def revoke_session(self, session_id: UUID, revoked_at: datetime) -> None:
        await self.session.execute(
            update(RefreshSession)
            .where(
                RefreshSession.id == session_id,
                RefreshSession.revoked_at.is_(None),
            )
            .values(revoked_at=revoked_at)
        )

    async def revoke_user_sessions(self, user_id: UUID, revoked_at: datetime) -> None:
        await self.session.execute(
            update(RefreshSession)
            .where(
                RefreshSession.user_id == user_id,
                RefreshSession.revoked_at.is_(None),
            )
            .values(revoked_at=revoked_at)
        )

    async def revoke_family(self, family_id: UUID, revoked_at: datetime) -> None:
        await self.session.execute(
            update(RefreshSession)
            .where(
                RefreshSession.family_id == family_id,
                RefreshSession.revoked_at.is_(None),
            )
            .values(revoked_at=revoked_at)
        )

    async def add_verification_token(self, token: VerificationToken) -> None:
        self.session.add(token)
        await self.session.flush()

    async def get_verification_token_for_update(
        self,
        token_hash: str,
        purpose: VerificationPurpose,
    ) -> VerificationToken | None:
        statement = (
            select(VerificationToken)
            .where(
                VerificationToken.token_hash == token_hash,
                VerificationToken.purpose == purpose,
            )
            .with_for_update()
        )
        return (await self.session.execute(statement)).scalar_one_or_none()

    async def consume_open_tokens(
        self,
        *,
        user_id: UUID,
        purpose: VerificationPurpose,
        consumed_at: datetime,
    ) -> None:
        await self.session.execute(
            update(VerificationToken)
            .where(
                VerificationToken.user_id == user_id,
                VerificationToken.purpose == purpose,
                VerificationToken.consumed_at.is_(None),
            )
            .values(consumed_at=consumed_at)
        )

    async def add_audit_log(self, audit_log: AuditLog) -> None:
        self.session.add(audit_log)
        await self.session.flush()

    async def list_active_sessions(self, user_id: UUID, now: datetime) -> Sequence[RefreshSession]:
        statement = (
            select(RefreshSession)
            .where(
                RefreshSession.user_id == user_id,
                RefreshSession.revoked_at.is_(None),
                RefreshSession.expires_at > now,
            )
            .order_by(RefreshSession.created_at.desc())
        )
        return (await self.session.scalars(statement)).all()
