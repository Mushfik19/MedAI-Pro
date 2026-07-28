"""Namespaced JSON cache abstraction."""

import json
from typing import Any

from redis.asyncio import Redis


class CacheService:
    """Provide explicit, namespaced cache operations over Redis."""

    def __init__(self, client: Redis, *, namespace: str = "mediai") -> None:
        self.client = client
        self.namespace = namespace

    def _key(self, key: str) -> str:
        return f"{self.namespace}:cache:{key}"

    async def get_json(self, key: str) -> Any | None:
        value = await self.client.get(self._key(key))
        return None if value is None else json.loads(value)

    async def set_json(self, key: str, value: Any, *, ttl_seconds: int) -> None:
        serialized = json.dumps(value, separators=(",", ":"), ensure_ascii=False)
        await self.client.set(self._key(key), serialized, ex=ttl_seconds)

    async def delete(self, key: str) -> bool:
        return bool(await self.client.delete(self._key(key)))
