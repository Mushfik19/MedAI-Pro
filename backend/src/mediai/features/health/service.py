"""Operational dependency checks."""

import asyncio
from collections.abc import Awaitable, Callable
from time import perf_counter

from mediai.core.enums import HealthStatus
from mediai.features.health.schemas import DependencyHealth, ReadinessResponse


class HealthService:
    """Check infrastructure readiness without exposing connection details."""

    def __init__(
        self,
        *,
        database_ping: Callable[[], Awaitable[bool]],
        redis_ping: Callable[[], Awaitable[bool]],
    ) -> None:
        self._checks = {
            "database": database_ping,
            "redis": redis_ping,
        }

    async def _run_check(
        self,
        check: Callable[[], Awaitable[bool]],
    ) -> DependencyHealth:
        started_at = perf_counter()
        try:
            ready = await check()
        # Readiness must degrade cleanly for any unavailable infrastructure driver.
        except Exception:  # noqa: BLE001
            ready = False
        return DependencyHealth(
            status=HealthStatus.OK if ready else HealthStatus.DEGRADED,
            latency_ms=round((perf_counter() - started_at) * 1_000, 2),
        )

    async def readiness(self) -> ReadinessResponse:
        names = list(self._checks)
        results = await asyncio.gather(*(self._run_check(self._checks[name]) for name in names))
        dependencies = dict(zip(names, results, strict=True))
        overall = (
            HealthStatus.OK
            if all(item.status is HealthStatus.OK for item in dependencies.values())
            else HealthStatus.DEGRADED
        )
        return ReadinessResponse(status=overall, dependencies=dependencies)
