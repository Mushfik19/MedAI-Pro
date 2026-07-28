"""FastAPI application composition root."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mediai.app.exceptions import register_exception_handlers
from mediai.app.lifespan import application_lifespan
from mediai.app.middleware import (
    AuthenticationContextMiddleware,
    RateLimitMiddleware,
    RequestContextMiddleware,
    SecurityHeadersMiddleware,
)
from mediai.core.config import Settings, get_settings
from mediai.core.logging import configure_logging
from mediai.core.openapi import build_openapi_schema
from mediai.infrastructure.database import DatabaseManager
from mediai.infrastructure.llm.service import MedicalLLMService
from mediai.infrastructure.ml.service import ClinicalModelService
from mediai.infrastructure.rate_limit.service import RedisRateLimiter
from mediai.infrastructure.redis import RedisManager
from mediai.infrastructure.security.jwt import JWTService
from mediai.infrastructure.security.passwords import PasswordHasher
from mediai.presentation.api.v1.router import api_v1_router

REQUIRED_CORS_ORIGINS = (
    "https://med-ai-pro-frontend.vercel.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
)


def create_application(
    *,
    settings: Settings | None = None,
    database: DatabaseManager | None = None,
    redis: RedisManager | None = None,
    ml_service: ClinicalModelService | None = None,
) -> FastAPI:
    """Create a fully configured application with injectable infrastructure."""

    resolved_settings = settings or get_settings()
    configure_logging(resolved_settings)

    app = FastAPI(
        title=resolved_settings.app_name,
        version=resolved_settings.app_version,
        debug=resolved_settings.debug,
        docs_url="/docs" if resolved_settings.docs_enabled else None,
        redoc_url="/redoc" if resolved_settings.docs_enabled else None,
        openapi_url="/openapi.json" if resolved_settings.docs_enabled else None,
        lifespan=application_lifespan,
    )

    app.state.settings = resolved_settings
    app.state.database = database or DatabaseManager(resolved_settings)
    app.state.redis = redis or RedisManager(resolved_settings)
    app.state.jwt_service = JWTService(resolved_settings)
    app.state.password_hasher = PasswordHasher()
    app.state.ml_service = ml_service or ClinicalModelService(resolved_settings)
    app.state.llm_service = MedicalLLMService(resolved_settings)

    cors_origins = list(
        dict.fromkeys((*resolved_settings.cors_origins, *REQUIRED_CORS_ORIGINS))
    )

    limiter = RedisRateLimiter(app.state.redis.client)
    app.add_middleware(
        RateLimitMiddleware,
        limiter=limiter,
        redis=app.state.redis,
        settings=resolved_settings,
    )
    app.add_middleware(
        AuthenticationContextMiddleware,
        jwt_service=app.state.jwt_service,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=[
            "ETag",
            "Retry-After",
            "X-Process-Time-Ms",
            "X-RateLimit-Limit",
            "X-RateLimit-Remaining",
            "X-RateLimit-Reset",
            "X-Request-ID",
        ],
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestContextMiddleware)

    register_exception_handlers(app)
    app.include_router(api_v1_router, prefix=resolved_settings.api_v1_prefix)

    def openapi_builder() -> dict[str, object]:
        return build_openapi_schema(app, resolved_settings)

    app.openapi = openapi_builder  # type: ignore[method-assign]
    return app
