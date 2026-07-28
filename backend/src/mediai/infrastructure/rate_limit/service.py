"""Atomic fixed-window rate limiting backed by Redis."""

from collections.abc import Awaitable
from dataclasses import dataclass
from hashlib import sha256
from time import time
from typing import Any, cast

from redis.asyncio import Redis

RATE_LIMIT_SCRIPT = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
local ttl = redis.call('TTL', KEYS[1])
return {current, ttl}
"""


@dataclass(frozen=True, slots=True)
class RateLimitDecision:
    allowed: bool
    limit: int
    remaining: int
    reset_epoch: int
    retry_after: int


class RedisRateLimiter:
    """Apply a distributed fixed-window request limit."""

    def __init__(self, client: Redis) -> None:
        self.client = client

    @staticmethod
    def build_key(identifier: str, route: str, window_seconds: int) -> str:
        bucket = int(time()) // window_seconds
        digest = sha256(f"{identifier}:{route}".encode()).hexdigest()
        return f"mediai:rate-limit:{digest}:{bucket}"

    async def check(
        self,
        *,
        identifier: str,
        route: str,
        limit: int,
        window_seconds: int,
    ) -> RateLimitDecision:
        key = self.build_key(identifier, route, window_seconds)
        evaluation = self.client.eval(RATE_LIMIT_SCRIPT, 1, key, str(window_seconds))
        raw_result = await cast(Awaitable[Any], evaluation)
        current, ttl = (int(raw_result[0]), max(int(raw_result[1]), 0))
        remaining = max(limit - current, 0)
        return RateLimitDecision(
            allowed=current <= limit,
            limit=limit,
            remaining=remaining,
            reset_epoch=int(time()) + ttl,
            retry_after=ttl,
        )
