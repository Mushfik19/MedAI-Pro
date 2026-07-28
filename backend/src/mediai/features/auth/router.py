"""Versioned authentication and authorization HTTP endpoints."""

from typing import Annotated

from fastapi import APIRouter, Header, Request, Response, status

from mediai.features.auth.dependencies import (
    AuthServiceDependency,
    CurrentUser,
    build_audit_context,
    enforce_login_rate_limit,
)
from mediai.features.auth.schemas import (
    AcceptedResponse,
    AdminLoginRequest,
    AuthenticatedResponse,
    ChangePasswordRequest,
    CurrentUserResponse,
    ForgotPasswordRequest,
    LoginRequest,
    RefreshResponse,
    RegisterRequest,
    RegistrationResponse,
    ResetPasswordRequest,
)
from mediai.infrastructure.security.dependencies import CurrentPrincipal
from mediai.shared.domain.exceptions import AuthenticationError
from mediai.shared.presentation.responses import envelope
from mediai.shared.presentation.schemas import ApiResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _set_refresh_cookie(response: Response, request: Request, token: str) -> None:
    settings = request.app.state.settings
    response.set_cookie(
        key=settings.refresh_cookie_name,
        value=token,
        max_age=settings.refresh_token_ttl_days * 24 * 60 * 60,
        path=f"{settings.api_v1_prefix}/auth",
        secure=settings.refresh_cookie_secure,
        httponly=True,
        samesite=settings.refresh_cookie_samesite,
    )


def _clear_refresh_cookie(response: Response, request: Request) -> None:
    settings = request.app.state.settings
    response.delete_cookie(
        key=settings.refresh_cookie_name,
        path=f"{settings.api_v1_prefix}/auth",
        secure=settings.refresh_cookie_secure,
        httponly=True,
        samesite=settings.refresh_cookie_samesite,
    )


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    summary="Register a patient account",
)
async def register(
    payload: RegisterRequest,
    request: Request,
    service: AuthServiceDependency,
) -> ApiResponse[RegistrationResponse]:
    result = await service.register(payload, build_audit_context(request))
    return envelope(result, request.state.request_id)


@router.post("/login", summary="Authenticate and create a rotating session")
async def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    service: AuthServiceDependency,
) -> ApiResponse[AuthenticatedResponse]:
    await enforce_login_rate_limit(request, str(payload.email))
    issued = await service.login(payload, build_audit_context(request))
    _set_refresh_cookie(response, request, issued.refresh_token)
    result = AuthenticatedResponse(
        access_token=issued.access_token,
        expires_in=issued.access_expires_in,
        csrf_token=issued.csrf_token,
    )
    return envelope(result, request.state.request_id)


@router.post("/admin/login", summary="Authenticate an administrator")
async def admin_login(
    payload: AdminLoginRequest,
    request: Request,
    response: Response,
    service: AuthServiceDependency,
) -> ApiResponse[AuthenticatedResponse]:
    await enforce_login_rate_limit(request, f"admin:{payload.username}")
    issued = await service.admin_login(payload, build_audit_context(request))
    _set_refresh_cookie(response, request, issued.refresh_token)
    result = AuthenticatedResponse(
        access_token=issued.access_token,
        expires_in=issued.access_expires_in,
        csrf_token=issued.csrf_token,
    )
    return envelope(result, request.state.request_id)


@router.post("/refresh", summary="Rotate a refresh session")
async def refresh(
    request: Request,
    response: Response,
    service: AuthServiceDependency,
    csrf_token: Annotated[str | None, Header(alias="X-CSRF-Token")] = None,
) -> ApiResponse[RefreshResponse]:
    settings = request.app.state.settings
    refresh_token = request.cookies.get(settings.refresh_cookie_name)
    if not refresh_token or not csrf_token:
        raise AuthenticationError("A refresh cookie and CSRF token are required.")
    issued = await service.refresh(
        raw_refresh_token=refresh_token,
        csrf_token=csrf_token,
        audit=build_audit_context(request),
    )
    _set_refresh_cookie(response, request, issued.refresh_token)
    result = RefreshResponse(
        access_token=issued.access_token,
        expires_in=issued.access_expires_in,
        csrf_token=issued.csrf_token,
    )
    return envelope(result, request.state.request_id)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Revoke the current refresh session",
)
async def logout(
    request: Request,
    response: Response,
    principal: CurrentPrincipal,
    service: AuthServiceDependency,
) -> Response:
    await service.logout(
        principal.user_id,
        principal.session_id,
        build_audit_context(request),
    )
    _clear_refresh_cookie(response, request)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.post(
    "/forgot-password",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Queue a password-reset email without disclosing account existence",
)
async def forgot_password(
    payload: ForgotPasswordRequest,
    request: Request,
    service: AuthServiceDependency,
) -> ApiResponse[AcceptedResponse]:
    await service.forgot_password(str(payload.email), build_audit_context(request))
    return envelope(AcceptedResponse(), request.state.request_id)


@router.post(
    "/reset-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Consume a password-reset token",
)
async def reset_password(
    payload: ResetPasswordRequest,
    request: Request,
    service: AuthServiceDependency,
) -> Response:
    await service.reset_password(payload, build_audit_context(request))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/change-password",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Change the authenticated user's password",
)
async def change_password(
    payload: ChangePasswordRequest,
    request: Request,
    response: Response,
    user: CurrentUser,
    service: AuthServiceDependency,
) -> Response:
    await service.change_password(
        user=user,
        request=payload,
        audit=build_audit_context(request),
    )
    _clear_refresh_cookie(response, request)
    response.status_code = status.HTTP_204_NO_CONTENT
    return response


@router.get("/me", summary="Return the authenticated identity and authorization policy")
async def me(
    request: Request,
    user: CurrentUser,
    service: AuthServiceDependency,
) -> ApiResponse[CurrentUserResponse]:
    return envelope(service.current_user_response(user), request.state.request_id)
