"""Transactional database outbox implementation of the email-service port."""

from datetime import datetime
from urllib.parse import urlencode

from sqlalchemy.ext.asyncio import AsyncSession

from mediai.core.config import Settings
from mediai.core.enums import EmailDeliveryStatus
from mediai.features.auth.models import EmailOutbox
from mediai.shared.utils.time import utc_now


class DatabaseEmailService:
    """Persist provider-neutral messages for an external delivery worker."""

    def __init__(self, session: AsyncSession, settings: Settings) -> None:
        self._session = session
        self._frontend_url = settings.frontend_url.rstrip("/")

    async def queue_password_reset(
        self,
        *,
        recipient: str,
        display_name: str,
        token: str,
        expires_at: datetime,
    ) -> None:
        await self._queue(
            recipient=recipient,
            template="reset_password",
            payload={
                "display_name": display_name,
                "reset_url": self._url("/auth/reset-password", token),
                "expires_at": expires_at.isoformat(),
            },
        )

    def _url(self, path: str, token: str) -> str:
        return f"{self._frontend_url}{path}?{urlencode({'token': token})}"

    async def _queue(
        self,
        *,
        recipient: str,
        template: str,
        payload: dict[str, str],
    ) -> None:
        self._session.add(
            EmailOutbox(
                recipient=recipient,
                template=template,
                payload=payload,
                status=EmailDeliveryStatus.PENDING,
                available_at=utc_now(),
            )
        )
        await self._session.flush()
