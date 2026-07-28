"""Async Redis connection ownership."""

from redis.asyncio import Redis

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

    async def ping(self) -> bool:
        return bool(await self.client.ping())

    async def close(self) -> None:
        await self.client.aclose()
