"""OpenAPI schema customization."""

from typing import Any

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

from mediai.core.config import Settings


def build_openapi_schema(app: FastAPI, settings: Settings) -> dict[str, Any]:
    """Build and cache the versioned MediAI OpenAPI contract."""

    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=settings.app_name,
        version=settings.app_version,
        description=(
            "MediAI Pro clinical decision-support API. This foundation exposes only "
            "operational endpoints; business APIs are added in separately approved phases."
        ),
        routes=app.routes,
    )
    schema["info"]["x-logo"] = {"altText": "MediAI Pro"}
    schema.setdefault("components", {}).setdefault("securitySchemes", {})[
        "OAuth2PasswordBearer"
    ] = {
        "type": "oauth2",
        "flows": {
            "password": {
                "tokenUrl": f"{settings.api_v1_prefix}/auth/login",
                "scopes": {},
            }
        },
    }
    schema["x-api-version"] = "v1"
    app.openapi_schema = schema
    return schema
