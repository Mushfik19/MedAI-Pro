from mediai.infrastructure.rate_limit.service import RedisRateLimiter


class ScriptedRedis:
    def __init__(self, result: list[int]) -> None:
        self.result = result

    async def eval(self, *_args: object) -> list[int]:
        return self.result


async def test_rate_limit_allows_request_with_capacity() -> None:
    limiter = RedisRateLimiter(ScriptedRedis([4, 30]))  # type: ignore[arg-type]
    decision = await limiter.check(
        identifier="user-id",
        route="GET:/resource",
        limit=10,
        window_seconds=60,
    )
    assert decision.allowed is True
    assert decision.remaining == 6
    assert decision.retry_after == 30


async def test_rate_limit_rejects_request_over_capacity() -> None:
    limiter = RedisRateLimiter(ScriptedRedis([11, 25]))  # type: ignore[arg-type]
    decision = await limiter.check(
        identifier="user-id",
        route="GET:/resource",
        limit=10,
        window_seconds=60,
    )
    assert decision.allowed is False
    assert decision.remaining == 0
