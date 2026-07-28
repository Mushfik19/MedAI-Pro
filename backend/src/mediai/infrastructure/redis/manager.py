"""Async Redis connection ownership."""

import asyncio

from loguru import logger
from redis.asyncio import Redis
from redis.exceptions import RedisError

from mediai.core.config import Settings


class RedisManager:
    """Own a decoded async Redis client."""

    def __init__(self, settings: Settings) -> None:
        self.client = Redis.from_url(
            settings.redis_url,
            decode_responses=True,
            health_check_interval=30,
            socket_connect_timeout=3,
            socket_timeout=3,
        )
        self.available = False
        self._retry_task: asyncio.Task[None] | None = None

    async def ping(self) -> bool:
        try:
            self.available = bool(await self.client.ping())
        except (RedisError, OSError, TimeoutError):
            self.available = False
        return self.available

    def start_background_retry(self) -> None:
        """Retry an unavailable Redis connection without blocking the API."""
        if self.available or (self._retry_task is not None and not self._retry_task.done()):
            return
        self._retry_task = asyncio.create_task(
            self._retry_until_available(),
            name="redis-connection-retry",
        )

    async def _retry_until_available(self) -> None:
        delay_seconds = 1
        while not self.available:
            await asyncio.sleep(delay_seconds)
            if await self.ping():
                logger.info("redis_connection_restored")
                return
            logger.warning(
                "redis_connection_retry_failed",
                retry_in_seconds=min(delay_seconds * 2, 30),
            )
            delay_seconds = min(delay_seconds * 2, 30)

    def mark_unavailable(self) -> None:
        """Record a runtime outage and resume connection retries."""
        was_available = self.available
        self.available = False
        if was_available:
            logger.warning("redis_connection_lost")
        self.start_background_retry()

    async def close(self) -> None:
        if self._retry_task is not None:
            self._retry_task.cancel()
            await asyncio.gather(self._retry_task, return_exceptions=True)
        await self.client.aclose()
