"""Authentication composition, current-user resolution, and login throttling."""

import hashlib
import hmac
from typing import Annotated

from fastapi import Depends, Request
from redis.exceptions import RedisError
from sqlalchemy.ext.asyncio import AsyncSession

from mediai.core.enums import UserStatus
from mediai.features.auth.domain import AuditContext
from mediai.features.auth.email import DatabaseEmailService
from mediai.features.auth.models import User
from mediai.features.auth.repository import AuthRepository
from mediai.features.auth.service import AuthenticationService
from mediai.infrastructure.database.dependencies import get_database_session
from mediai.infrastructure.rate_limit.service import RedisRateLimiter
from mediai.infrastructure.security.dependencies import CurrentPrincipal
from mediai.shared.domain.exceptions import (
    AuthenticationError,
    RateLimitExceededError,
)
from mediai.shared.utils.time import utc_now

DatabaseSession = Annotated[AsyncSession, Depends(get_database_session)]


def get_authentication_service(
    request: Request,
    session: DatabaseSession,
) -> AuthenticationService:
    return AuthenticationService(
        repository=AuthRepository(session),
        email_service=DatabaseEmailService(session, request.app.state.settings),
        password_hasher=request.app.state.password_hasher,
        jwt_service=request.app.state.jwt_service,
        settings=request.app.state.settings,
    )


AuthServiceDependency = Annotated[
    AuthenticationService,
    Depends(get_authentication_service),
]


async def get_current_user(
    principal: CurrentPrincipal,
    session: DatabaseSession,
) -> User:
    repository = AuthRepository(session)
    user = await repository.get_user_by_id(principal.user_id)
    refresh_session = await repository.get_session(principal.session_id)
    now = utc_now()
    if (
        user is None
        or user.status is not UserStatus.ACTIVE
        or refresh_session is None
        or refresh_session.user_id != user.id
        or refresh_session.revoked_at is not None
        or refresh_session.expires_at <= now
    ):
        raise AuthenticationError("The authenticated session is no longer active.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def build_audit_context(request: Request) -> AuditContext:
    secret = request.app.state.settings.jwt_secret_key.get_secret_value().encode("utf-8")
    client_ip = request.client.host if request.client else None
    ip_hash = (
        hmac.new(secret, client_ip.encode("utf-8"), hashlib.sha256).hexdigest()
        if client_ip
        else None
    )
    user_agent = request.headers.get("User-Agent")
    return AuditContext(
        request_id=request.state.request_id,
        ip_hash=ip_hash,
        user_agent=user_agent[:512] if user_agent else None,
    )


async def enforce_login_rate_limit(request: Request, email: str) -> None:
    settings = request.app.state.settings
    client_ip = request.client.host if request.client else "unknown"
    identifier = f"{client_ip}:{email}"
    limiter = RedisRateLimiter(request.app.state.redis.client)
    try:
        decision = await limiter.check(
            identifier=identifier,
            route="POST:/api/v1/auth/login",
            limit=settings.login_rate_limit_requests,
            window_seconds=settings.login_rate_limit_window_seconds,
        )
    except RedisError:
        request.app.state.redis.mark_unavailable()
        return
    if not decision.allowed:
        raise RateLimitExceededError(decision.retry_after)
