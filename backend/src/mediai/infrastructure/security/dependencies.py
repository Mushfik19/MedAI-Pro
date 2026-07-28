"""OAuth2 bearer authentication and reusable RBAC dependencies."""

from collections.abc import Awaitable, Callable
from typing import Annotated

from fastapi import Depends, Request
from fastapi.security import OAuth2PasswordBearer

from mediai.core.enums import Permission, UserRole
from mediai.infrastructure.security.principal import AuthenticatedPrincipal
from mediai.shared.domain.exceptions import AuthenticationError, AuthorizationError

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
    auto_error=False,
)


async def get_current_principal(
    request: Request,
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> AuthenticatedPrincipal:
    principal = getattr(request.state, "principal", None)
    if token is None or not isinstance(principal, AuthenticatedPrincipal):
        raise AuthenticationError()
    return principal


CurrentPrincipal = Annotated[AuthenticatedPrincipal, Depends(get_current_principal)]


def require_roles(
    *allowed_roles: UserRole,
) -> Callable[[CurrentPrincipal], Awaitable[AuthenticatedPrincipal]]:
    allowed = frozenset(allowed_roles)

    async def dependency(principal: CurrentPrincipal) -> AuthenticatedPrincipal:
        if principal.role not in allowed:
            raise AuthorizationError()
        return principal

    return dependency


def require_permissions(
    *required_permissions: Permission,
) -> Callable[[CurrentPrincipal], Awaitable[AuthenticatedPrincipal]]:
    required = frozenset(required_permissions)

    async def dependency(principal: CurrentPrincipal) -> AuthenticatedPrincipal:
        if not required.issubset(principal.permissions):
            raise AuthorizationError()
        return principal

    return dependency
