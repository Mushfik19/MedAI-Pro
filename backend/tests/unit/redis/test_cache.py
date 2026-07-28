"""Cache serialization contract tests."""

from unittest.mock import AsyncMock, Mock

from mediai.infrastructure.redis.cache import CacheService


async def test_cache_service_serializes_namespaced_json() -> None:
    client = Mock()
    client.get = AsyncMock(return_value='{"risk":"low"}')
    client.set = AsyncMock()
    client.delete = AsyncMock(return_value=1)
    cache = CacheService(client, namespace="test")

    value = await cache.get_json("assessment")
    await cache.set_json("assessment", {"risk": "low"}, ttl_seconds=30)
    deleted = await cache.delete("assessment")

    assert value == {"risk": "low"}
    assert deleted is True
    client.get.assert_awaited_once_with("test:cache:assessment")
    client.set.assert_awaited_once_with(
        "test:cache:assessment",
        '{"risk":"low"}',
        ex=30,
    )
    client.delete.assert_awaited_once_with("test:cache:assessment")


async def test_cache_miss_returns_none() -> None:
    client = Mock()
    client.get = AsyncMock(return_value=None)

    assert await CacheService(client).get_json("missing") is None
