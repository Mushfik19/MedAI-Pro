"""Pure-ASGI middleware for request context, security, auth, and rate limits."""

from collections.abc import Iterable
from time import perf_counter
from typing import Any
from uuid import UUID, uuid4

from loguru import logger
from redis.exceptions import RedisError
from starlette.datastructures import Headers, MutableHeaders
from starlette.requests import Request
from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from mediai.core.config import Settings
from mediai.core.constants import (
    PROBLEM_DETAILS_MEDIA_TYPE,
    PROCESS_TIME_HEADER,
    RATE_LIMIT_LIMIT_HEADER,
    RATE_LIMIT_REMAINING_HEADER,
    RATE_LIMIT_RESET_HEADER,
    REQUEST_ID_HEADER,
)
from mediai.infrastructure.rate_limit.service import RedisRateLimiter
from mediai.infrastructure.security.jwt import JWTService
from mediai.infrastructure.security.principal import AuthenticatedPrincipal
from mediai.shared.domain.exceptions import AuthenticationError


def _valid_request_id(value: str | None) -> str:
    if not value or len(value) > 128:
        return str(uuid4())
    try:
        return str(UUID(value))
    except ValueError:
        return str(uuid4())


class RequestContextMiddleware:
    """Attach a trusted request ID and emit one structured access log."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = Headers(scope=scope)
        request_id = _valid_request_id(headers.get(REQUEST_ID_HEADER))
        scope.setdefault("state", {})["request_id"] = request_id
        started_at = perf_counter()
        status_code = 500

        async def send_with_context(message: Message) -> None:
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message["status"]
                response_headers = MutableHeaders(scope=message)
                response_headers[REQUEST_ID_HEADER] = request_id
                response_headers[PROCESS_TIME_HEADER] = (
                    f"{(perf_counter() - started_at) * 1_000:.2f}"
                )
            await send(message)

        with logger.contextualize(
            request_id=request_id,
            method=scope["method"],
            path=scope["path"],
        ):
            try:
                await self.app(scope, receive, send_with_context)
            finally:
                logger.info(
                    "request_completed",
                    status_code=status_code,
                    duration_ms=round((perf_counter() - started_at) * 1_000, 2),
                )


class SecurityHeadersMiddleware:
    """Apply defensive headers to every HTTP response."""

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        async def send_with_security_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers["X-Content-Type-Options"] = "nosniff"
                headers["X-Frame-Options"] = "DENY"
                headers["Referrer-Policy"] = "no-referrer"
                headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
                headers["Cache-Control"] = "no-store"
            await send(message)

        await self.app(scope, receive, send_with_security_headers)


class AuthenticationContextMiddleware:
    """Decode an optional bearer token into request state without authorizing."""

    def __init__(self, app: ASGIApp, jwt_service: JWTService) -> None:
        self.app = app
        self.jwt_service = jwt_service

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] == "http":
            scope.setdefault("state", {})["principal"] = None
            authorization = Headers(scope=scope).get("Authorization")
            if authorization:
                scheme, _, token = authorization.partition(" ")
                if scheme.lower() == "bearer" and token:
                    try:
                        payload = self.jwt_service.decode_access_token(token)
                        scope["state"]["principal"] = AuthenticatedPrincipal(
                            user_id=payload.sub,
                            role=payload.role,
                            permissions=payload.permissions,
                            session_id=payload.sid,
                        )
                    except AuthenticationError:
                        pass
        await self.app(scope, receive, send)


class RateLimitMiddleware:
    """Enforce a Redis-backed rate limit before requests reach route handlers."""

    excluded_paths = frozenset(
        {
            "/api/v1/health/live",
            "/api/v1/health/ready",
            "/docs",
            "/redoc",
            "/openapi.json",
        }
    )

    def __init__(
        self,
        app: ASGIApp,
        *,
        limiter: RedisRateLimiter,
        settings: Settings,
    ) -> None:
        self.app = app
        self.limiter = limiter
        self.settings = settings

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if (
            scope["type"] != "http"
            or not self.settings.rate_limit_enabled
            or scope["method"] == "OPTIONS"
            or scope["path"] in self.excluded_paths
        ):
            await self.app(scope, receive, send)
            return

        request = Request(scope)
        identifier = request.client.host if request.client else "unknown"
        principal = scope.get("state", {}).get("principal")
        if isinstance(principal, AuthenticatedPrincipal):
            identifier = str(principal.user_id)

        try:
            decision = await self.limiter.check(
                identifier=identifier,
                route=f"{scope['method']}:{scope['path']}",
                limit=self.settings.rate_limit_requests,
                window_seconds=self.settings.rate_limit_window_seconds,
            )
        except RedisError:
            logger.exception("rate_limit_backend_unavailable")
            if self.settings.rate_limit_fail_open:
                await self.app(scope, receive, send)
                return
            response = self._problem_response(
                request,
                status_code=503,
                code="RATE_LIMIT_UNAVAILABLE",
                title="Service unavailable",
                detail="Request admission is temporarily unavailable.",
            )
            await response(scope, receive, send)
            return

        if not decision.allowed:
            response = self._problem_response(
                request,
                status_code=429,
                code="RATE_LIMITED",
                title="Too many requests",
                detail="The request rate limit has been exceeded.",
                headers={"Retry-After": str(decision.retry_after)},
            )
            response.headers[RATE_LIMIT_LIMIT_HEADER] = str(decision.limit)
            response.headers[RATE_LIMIT_REMAINING_HEADER] = "0"
            response.headers[RATE_LIMIT_RESET_HEADER] = str(decision.reset_epoch)
            await response(scope, receive, send)
            return

        async def send_with_rate_headers(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = MutableHeaders(scope=message)
                headers[RATE_LIMIT_LIMIT_HEADER] = str(decision.limit)
                headers[RATE_LIMIT_REMAINING_HEADER] = str(decision.remaining)
                headers[RATE_LIMIT_RESET_HEADER] = str(decision.reset_epoch)
            await send(message)

        await self.app(scope, receive, send_with_rate_headers)

    @staticmethod
    def _problem_response(
        request: Request,
        *,
        status_code: int,
        code: str,
        title: str,
        detail: str,
        headers: dict[str, str] | None = None,
    ) -> JSONResponse:
        request_id = getattr(request.state, "request_id", str(uuid4()))
        return JSONResponse(
            status_code=status_code,
            media_type=PROBLEM_DETAILS_MEDIA_TYPE,
            headers=headers,
            content={
                "type": f"urn:mediai:problem:{code.lower().replace('_', '-')}",
                "title": title,
                "status": status_code,
                "detail": detail,
                "instance": request.url.path,
                "code": code,
                "request_id": request_id,
                "errors": [],
            },
        )


def registered_middleware_names(middleware: Iterable[Any]) -> list[str]:
    """Expose middleware order for diagnostics and focused tests."""

    return [item.cls.__name__ for item in middleware]
