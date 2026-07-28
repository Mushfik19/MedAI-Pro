"""Global RFC 9457-style Problem Details exception handling."""

from collections.abc import Mapping
from http import HTTPStatus
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from loguru import logger

from mediai.core.constants import PROBLEM_DETAILS_MEDIA_TYPE, REQUEST_ID_HEADER
from mediai.shared.domain.exceptions import ApplicationError
from mediai.shared.presentation.schemas import FieldProblem, ProblemDetails


def _request_id(request: Request) -> str:
    return getattr(request.state, "request_id", str(uuid4()))


def _response(problem: ProblemDetails, *, headers: Mapping[str, str] | None = None) -> JSONResponse:
    response_headers = {REQUEST_ID_HEADER: problem.request_id, **(headers or {})}
    return JSONResponse(
        status_code=problem.status,
        content=problem.model_dump(mode="json"),
        headers=response_headers,
        media_type=PROBLEM_DETAILS_MEDIA_TYPE,
    )


async def application_error_handler(request: Request, error: ApplicationError) -> JSONResponse:
    problem = ProblemDetails(
        type=f"urn:mediai:problem:{error.code.lower().replace('_', '-')}",
        title=error.title,
        status=error.status_code,
        detail=error.detail,
        instance=request.url.path,
        code=error.code,
        request_id=_request_id(request),
    )
    headers: dict[str, str] = {}
    if error.status_code == 401:
        headers["WWW-Authenticate"] = "Bearer"
    if error.status_code == 429 and "retry_after" in error.context:
        headers["Retry-After"] = str(error.context["retry_after"])
    return _response(problem, headers=headers)


async def validation_error_handler(request: Request, error: RequestValidationError) -> JSONResponse:
    errors = [
        FieldProblem(
            field=".".join(str(part) for part in item["loc"] if part != "body"),
            code=item["type"],
            message=item["msg"],
        )
        for item in error.errors()
    ]
    return _response(
        ProblemDetails(
            type="urn:mediai:problem:validation-error",
            title="Request validation failed",
            status=422,
            detail="One or more request fields are invalid.",
            instance=request.url.path,
            code="VALIDATION_ERROR",
            request_id=_request_id(request),
            errors=errors,
        )
    )


async def http_error_handler(request: Request, error: HTTPException) -> JSONResponse:
    status_phrase = HTTPStatus(error.status_code).phrase
    detail = error.detail if isinstance(error.detail, str) else status_phrase
    return _response(
        ProblemDetails(
            type=f"urn:mediai:problem:http-{error.status_code}",
            title=status_phrase,
            status=error.status_code,
            detail=detail,
            instance=request.url.path,
            code=f"HTTP_{error.status_code}",
            request_id=_request_id(request),
        ),
        headers=error.headers,
    )


async def unhandled_error_handler(request: Request, error: Exception) -> JSONResponse:
    logger.exception("unhandled_application_error", error_type=type(error).__name__)
    return _response(
        ProblemDetails(
            type="urn:mediai:problem:internal-error",
            title="Internal server error",
            status=500,
            detail="An unexpected error occurred.",
            instance=request.url.path,
            code="INTERNAL_ERROR",
            request_id=_request_id(request),
        )
    )


def register_exception_handlers(app: FastAPI) -> None:
    # Starlette's handler type is invariant in Exception while handlers are safely specialized.
    app.add_exception_handler(ApplicationError, application_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, validation_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(HTTPException, http_error_handler)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, unhandled_error_handler)
