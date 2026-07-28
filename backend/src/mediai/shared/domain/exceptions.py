"""Application exceptions independent from HTTP and persistence frameworks."""

from collections.abc import Mapping
from typing import Any


class ApplicationError(Exception):
    """Base exception carrying a stable machine-readable error contract."""

    def __init__(
        self,
        *,
        code: str,
        detail: str,
        status_code: int,
        title: str,
        context: Mapping[str, Any] | None = None,
    ) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail
        self.status_code = status_code
        self.title = title
        self.context = dict(context or {})


class AuthenticationError(ApplicationError):
    def __init__(self, detail: str = "Authentication is required.") -> None:
        super().__init__(
            code="AUTHENTICATION_REQUIRED",
            detail=detail,
            status_code=401,
            title="Authentication required",
        )


class InvalidCredentialsError(ApplicationError):
    def __init__(self, detail: str = "The supplied credentials are invalid.") -> None:
        super().__init__(
            code="AUTH_INVALID",
            detail=detail,
            status_code=401,
            title="Authentication failed",
        )


class AccountUnavailableError(ApplicationError):
    def __init__(self, detail: str) -> None:
        super().__init__(
            code="ACCOUNT_UNAVAILABLE",
            detail=detail,
            status_code=403,
            title="Account unavailable",
        )


class InvalidTokenError(ApplicationError):
    def __init__(self, detail: str = "The one-time token is invalid or expired.") -> None:
        super().__init__(
            code="TOKEN_INVALID",
            detail=detail,
            status_code=400,
            title="Invalid token",
        )


class AuthorizationError(ApplicationError):
    def __init__(self, detail: str = "You do not have permission to perform this action.") -> None:
        super().__init__(
            code="FORBIDDEN",
            detail=detail,
            status_code=403,
            title="Forbidden",
        )


class ResourceNotFoundError(ApplicationError):
    def __init__(self, resource: str) -> None:
        super().__init__(
            code="NOT_FOUND",
            detail=f"{resource} was not found.",
            status_code=404,
            title="Resource not found",
        )


class ConflictError(ApplicationError):
    def __init__(self, detail: str) -> None:
        super().__init__(
            code="CONFLICT",
            detail=detail,
            status_code=409,
            title="Conflict",
        )


class InfrastructureUnavailableError(ApplicationError):
    def __init__(self, dependency: str) -> None:
        super().__init__(
            code="DEPENDENCY_UNAVAILABLE",
            detail=f"{dependency} is temporarily unavailable.",
            status_code=503,
            title="Service unavailable",
        )


class RateLimitExceededError(ApplicationError):
    def __init__(self, retry_after: int) -> None:
        super().__init__(
            code="RATE_LIMITED",
            detail="Too many authentication attempts. Try again later.",
            status_code=429,
            title="Too many requests",
            context={"retry_after": max(retry_after, 1)},
        )


class ModelUnavailableError(ApplicationError):
    def __init__(self, detail: str = "The clinical prediction model is unavailable.") -> None:
        super().__init__(
            code="MODEL_UNAVAILABLE",
            detail=detail,
            status_code=503,
            title="Model unavailable",
        )


class DatasetUnavailableError(ApplicationError):
    def __init__(self, detail: str = "The clinical dataset could not be loaded.") -> None:
        super().__init__(
            code="DATASET_UNAVAILABLE",
            detail=detail,
            status_code=503,
            title="Dataset unavailable",
        )


class LLMServiceError(ApplicationError):
    def __init__(self, detail: str = "The language model service is unavailable.") -> None:
        super().__init__(
            code="LLM_UNAVAILABLE",
            detail=detail,
            status_code=503,
            title="LLM unavailable",
        )


class ReportGenerationError(ApplicationError):
    def __init__(self, detail: str = "The PDF report could not be generated.") -> None:
        super().__init__(
            code="REPORT_GENERATION_FAILED",
            detail=detail,
            status_code=500,
            title="Report generation failed",
        )
