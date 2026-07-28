"""Idempotent provisioning for the configured bootstrap administrator."""

from fastapi import FastAPI
from loguru import logger
from sqlalchemy import text

from mediai.core.enums import Environment, UserRole, UserStatus
from mediai.features.auth.models import User, UserProfile
from mediai.features.auth.repository import AuthRepository
from mediai.shared.domain.exceptions import InfrastructureUnavailableError
from mediai.shared.utils.time import utc_now


async def seed_default_administrator(app: FastAPI) -> None:
    settings = app.state.settings
    if not settings.seed_default_admin or settings.environment is Environment.TEST:
        return

    async with app.state.database.session() as session:
        if session.bind and session.bind.dialect.name == "postgresql":
            await session.execute(text("SELECT pg_advisory_xact_lock(672349821)"))

        repository = AuthRepository(session)
        username = settings.default_admin_username
        if await repository.get_user_by_username(username) is not None:
            logger.info("default_administrator_exists", username=username)
            return

        admin_role = await repository.get_role(UserRole.ADMIN)
        if admin_role is None:
            raise InfrastructureUnavailableError("administrator role")

        now = utc_now()
        user = User(
            username=username,
            email=settings.default_admin_email.strip().lower(),
            password_hash=app.state.password_hasher.hash(
                settings.default_admin_password.get_secret_value()
            ),
            role_id=admin_role.id,
            role=admin_role,
            status=UserStatus.ACTIVE,
            email_verified_at=now,
            password_changed_at=now,
            profile=UserProfile(display_name="System Administrator", timezone="UTC"),
        )
        await repository.add_user(user)
        logger.info("default_administrator_created", username=username)
