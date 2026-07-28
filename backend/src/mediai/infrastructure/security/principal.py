"""Authenticated request identity types."""

from uuid import UUID

from pydantic import BaseModel, ConfigDict

from mediai.core.enums import Permission, UserRole


class AuthenticatedPrincipal(BaseModel):
    model_config = ConfigDict(frozen=True, extra="forbid")

    user_id: UUID
    role: UserRole
    permissions: frozenset[Permission]
    session_id: UUID
