"""Authentication HTTP contract and secure-cookie integration tests."""

from datetime import timedelta
from uuid import uuid4

from fastapi import FastAPI
from httpx import AsyncClient

from mediai.core.config import Settings
from mediai.core.enums import Permission, UserRole, UserStatus
from mediai.features.auth.dependencies import (
    get_authentication_service,
    get_current_user,
)
from mediai.features.auth.domain import IssuedSession
from mediai.features.auth.models import PermissionModel, Role, User, UserProfile
from mediai.features.auth.schemas import (
    CurrentUserResponse,
    RegistrationResponse,
)
from mediai.infrastructure.security.jwt import JWTService
from mediai.shared.utils.time import utc_now


class StubAuthenticationService:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.logout_calls: list[tuple[object, object]] = []

    async def register(self, *_args: object) -> RegistrationResponse:
        return RegistrationResponse(user_id=uuid4())

    async def login(self, *_args: object) -> IssuedSession:
        return IssuedSession(
            access_token="access-token",
            refresh_token="refresh-token",
            csrf_token="c" * 43,
            access_expires_in=900,
            session_id=uuid4(),
        )

    async def refresh(self, **_kwargs: object) -> IssuedSession:
        return IssuedSession(
            access_token="rotated-access-token",
            refresh_token="rotated-refresh-token",
            csrf_token="r" * 43,
            access_expires_in=900,
            session_id=uuid4(),
        )

    async def logout(self, user_id: object, session_id: object, *_args: object) -> None:
        self.logout_calls.append((user_id, session_id))

    @staticmethod
    def current_user_response(user: User) -> CurrentUserResponse:
        return CurrentUserResponse(
            id=user.id,
            email=user.email,
            display_name=user.profile.display_name,
            role=user.role.name,
            status=user.status,
            permissions=[permission.code for permission in user.role.permissions],
            email_verified=True,
        )


async def test_login_sets_http_only_scoped_refresh_cookie(
    app: FastAPI,
    client: AsyncClient,
    settings: Settings,
) -> None:
    service = StubAuthenticationService(settings)
    app.dependency_overrides[get_authentication_service] = lambda: service

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": "patient@example.com", "password": "SecurePassword1"},
    )

    assert response.status_code == 200
    assert response.json()["data"]["status"] == "AUTHENTICATED"
    assert response.json()["data"]["access_token"] == "access-token"
    cookie = response.headers["set-cookie"]
    assert "mediai_refresh=refresh-token" in cookie
    assert "HttpOnly" in cookie
    assert "Path=/api/v1/auth" in cookie
    assert "SameSite=lax" in cookie


async def test_refresh_requires_csrf_and_rotates_cookie(
    app: FastAPI,
    client: AsyncClient,
    settings: Settings,
) -> None:
    service = StubAuthenticationService(settings)
    app.dependency_overrides[get_authentication_service] = lambda: service
    client.cookies.set(settings.refresh_cookie_name, "refresh-token")

    missing_csrf = await client.post("/api/v1/auth/refresh")
    rotated = await client.post(
        "/api/v1/auth/refresh",
        headers={"X-CSRF-Token": "c" * 43},
    )

    assert missing_csrf.status_code == 401
    assert rotated.status_code == 200
    assert rotated.json()["data"]["access_token"] == "rotated-access-token"
    assert "rotated-refresh-token" in rotated.headers["set-cookie"]


async def test_logout_is_protected_and_clears_cookie(
    app: FastAPI,
    client: AsyncClient,
    settings: Settings,
) -> None:
    service = StubAuthenticationService(settings)
    app.dependency_overrides[get_authentication_service] = lambda: service
    user_id = uuid4()
    session_id = uuid4()
    access_token = JWTService(settings).create_access_token(
        user_id=user_id,
        session_id=session_id,
        role=UserRole.PATIENT,
        permissions=frozenset({Permission.PROFILE_MANAGE}),
    )

    unauthorized = await client.post("/api/v1/auth/logout")
    response = await client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    assert unauthorized.status_code == 401
    assert response.status_code == 204
    assert service.logout_calls == [(user_id, session_id)]
    assert "Max-Age=0" in response.headers["set-cookie"]


async def test_me_returns_database_backed_authorization_policy(
    app: FastAPI,
    client: AsyncClient,
    settings: Settings,
) -> None:
    permission = PermissionModel(
        id=uuid4(),
        code=Permission.PROFILE_MANAGE,
        description="Manage profile",
    )
    role = Role(
        id=uuid4(),
        name=UserRole.PATIENT,
        description="Patient",
        is_system=True,
        permissions=[permission],
    )
    user = User(
        id=uuid4(),
        email="patient@example.com",
        password_hash="not-returned",
        role_id=role.id,
        role=role,
        status=UserStatus.ACTIVE,
        email_verified_at=utc_now(),
        password_changed_at=utc_now() - timedelta(days=1),
        profile=UserProfile(display_name="MediAI Patient", timezone="UTC"),
    )
    service = StubAuthenticationService(settings)
    app.dependency_overrides[get_authentication_service] = lambda: service
    app.dependency_overrides[get_current_user] = lambda: user

    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 200
    assert response.json()["data"] == {
        "id": str(user.id),
        "email": "patient@example.com",
        "display_name": "MediAI Patient",
        "role": "PATIENT",
        "status": "ACTIVE",
        "permissions": ["profile:manage"],
        "email_verified": True,
    }
