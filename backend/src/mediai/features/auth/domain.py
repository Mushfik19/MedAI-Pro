"""Framework-independent authentication contracts and value objects."""

from dataclasses import dataclass
from datetime import datetime
from typing import Protocol
from uuid import UUID


@dataclass(frozen=True, slots=True)
class AuditContext:
    request_id: str
    ip_hash: str | None
    user_agent: str | None


class EmailService(Protocol):
    """Provider-neutral transactional email queue."""

    async def queue_password_reset(
        self,
        *,
        recipient: str,
        display_name: str,
        token: str,
        expires_at: datetime,
    ) -> None:
        """Queue a one-time password-reset message."""


@dataclass(frozen=True, slots=True)
class IssuedSession:
    access_token: str
    refresh_token: str
    csrf_token: str
    access_expires_in: int
    session_id: UUID
