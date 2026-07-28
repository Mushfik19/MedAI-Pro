"""Authentication workflow tests with isolated persistence and email ports."""

from datetime import datetime
from typing import cast
from uuid import UUID, uuid4

import pytest

from mediai.core.config import Settings
from mediai.core.enums import (
    Permission,
    UserRole,
    UserStatus,
    VerificationPurpose,
)
from mediai.features.auth.domain import AuditContext
from mediai.features.auth.models import (
    AuditLog,
    PermissionModel,
    RefreshSession,
    Role,
    User,
    VerificationToken,
)
from mediai.features.auth.repository import AuthRepository
from mediai.features.auth.schemas import (
    AdminLoginRequest,
    ChangePasswordRequest,
    LoginRequest,
    RegisterRequest,
    ResetPasswordRequest,
)
from mediai.features.auth.service import AuthenticationService
from mediai.infrastructure.security.jwt import JWTService
from mediai.infrastructure.security.passwords import PasswordHasher
from mediai.shared.domain.exceptions import InvalidCredentialsError


class FakeSession:
    def __init__(self) -> None:
        self.added: list[object] = []
        self.commits = 0

    def add(self, entity: object) -> None:
        self.added.append(entity)

    async def commit(self) -> None:
        self.commits += 1


class MemoryAuthRepository:
    def __init__(self) -> None:
        self.session = FakeSession()
        permissions = [
            PermissionModel(id=uuid4(), code=code, description=code.value)
            for code in (Permission.PROFILE_MANAGE, Permission.PREDICTION_READ)
        ]
        self.patient_role = Role(
            id=uuid4(),
            name=UserRole.PATIENT,
            description="Patient",
            is_system=True,
            permissions=permissions,
        )
        self.admin_role = Role(
            id=uuid4(),
            name=UserRole.ADMIN,
            description="Administrator",
            is_system=True,
            permissions=permissions,
        )
        self.users_by_email: dict[str, User] = {}
        self.users_by_username: dict[str, User] = {}
        self.users_by_id: dict[UUID, User] = {}
        self.sessions: dict[UUID, RefreshSession] = {}
        self.tokens: list[VerificationToken] = []
        self.audit_logs: list[AuditLog] = []

    async def get_role(self, role: UserRole) -> Role | None:
        if role is UserRole.PATIENT:
            return self.patient_role
        return self.admin_role if role is UserRole.ADMIN else None

    async def get_user_by_email(self, email: str) -> User | None:
        return self.users_by_email.get(email)

    async def get_user_by_username(self, username: str) -> User | None:
        return self.users_by_username.get(username)

    async def get_user_by_id(self, user_id: UUID) -> User | None:
        return self.users_by_id.get(user_id)

    async def add_user(self, user: User) -> User:
        user.id = user.id or uuid4()
        self.users_by_email[user.email] = user
        if user.username:
            self.users_by_username[user.username] = user
        self.users_by_id[user.id] = user
        return user

    async def add_verification_token(self, token: VerificationToken) -> None:
        token.id = token.id or uuid4()
        self.tokens.append(token)

    async def get_verification_token_for_update(
        self,
        token_hash: str,
        purpose: VerificationPurpose,
    ) -> VerificationToken | None:
        return next(
            (
                token
                for token in self.tokens
                if token.token_hash == token_hash and token.purpose is purpose
            ),
            None,
        )

    async def consume_open_tokens(
        self,
        *,
        user_id: UUID,
        purpose: VerificationPurpose,
        consumed_at: datetime,
    ) -> None:
        for token in self.tokens:
            if token.user_id == user_id and token.purpose is purpose and token.consumed_at is None:
                token.consumed_at = consumed_at

    async def add_session(self, session: RefreshSession) -> RefreshSession:
        self.sessions[session.id] = session
        return session

    async def get_session_for_update(self, session_id: UUID) -> RefreshSession | None:
        return self.sessions.get(session_id)

    async def revoke_session(self, session_id: UUID, revoked_at: datetime) -> None:
        if session := self.sessions.get(session_id):
            session.revoked_at = revoked_at

    async def revoke_user_sessions(self, user_id: UUID, revoked_at: datetime) -> None:
        for session in self.sessions.values():
            if session.user_id == user_id and session.revoked_at is None:
                session.revoked_at = revoked_at

    async def revoke_family(self, family_id: UUID, revoked_at: datetime) -> None:
        for session in self.sessions.values():
            if session.family_id == family_id and session.revoked_at is None:
                session.revoked_at = revoked_at

    async def add_audit_log(self, audit_log: AuditLog) -> None:
        self.audit_logs.append(audit_log)


class CapturingEmailService:
    def __init__(self) -> None:
        self.reset_token: str | None = None

    async def queue_password_reset(
        self,
        *,
        recipient: str,
        display_name: str,
        token: str,
        expires_at: datetime,
    ) -> None:
        assert recipient
        assert display_name
        assert expires_at
        self.reset_token = token


@pytest.fixture
def auth_components(
    settings: Settings,
) -> tuple[AuthenticationService, MemoryAuthRepository, CapturingEmailService]:
    repository = MemoryAuthRepository()
    email = CapturingEmailService()
    service = AuthenticationService(
        repository=cast(AuthRepository, repository),
        email_service=email,
        password_hasher=PasswordHasher(),
        jwt_service=JWTService(settings),
        settings=settings,
    )
    return service, repository, email


@pytest.fixture
def audit() -> AuditContext:
    return AuditContext(request_id=str(uuid4()), ip_hash="ip-hash", user_agent="pytest")


async def register_active_user(
    service: AuthenticationService,
    repository: MemoryAuthRepository,
    email: CapturingEmailService,
    audit: AuditContext,
) -> User:
    result = await service.register(
        RegisterRequest(
            email="patient@example.com",
            password="SecurePassword1",
            display_name="MediAI Patient",
            timezone="UTC",
        ),
        audit,
    )
    return repository.users_by_id[result.user_id]


async def test_registration_activates_user_without_email_verification(
    auth_components: tuple[
        AuthenticationService,
        MemoryAuthRepository,
        CapturingEmailService,
    ],
    audit: AuditContext,
) -> None:
    service, repository, email = auth_components

    result = await service.register(
        RegisterRequest(
            email="active@example.com",
            password="SecurePassword1",
            display_name="Active Patient",
            timezone="UTC",
        ),
        audit,
    )

    user = repository.users_by_id[result.user_id]
    issued = await service.login(
        LoginRequest(email="active@example.com", password="SecurePassword1"),
        audit,
    )

    assert user.status is UserStatus.ACTIVE
    assert user.email_verified_at is not None
    assert email.reset_token is None
    assert issued.access_token
    assert issued.refresh_token


async def test_admin_login_accepts_only_an_admin_username(
    auth_components: tuple[
        AuthenticationService,
        MemoryAuthRepository,
        CapturingEmailService,
    ],
    audit: AuditContext,
) -> None:
    service, repository, _ = auth_components
    admin = User(
        id=uuid4(),
        username="mushfik324",
        email="mushfik324@admin.local",
        password_hash=service.password_hasher.hash("1324"),
        role_id=repository.admin_role.id,
        role=repository.admin_role,
        status=UserStatus.ACTIVE,
    )
    await repository.add_user(admin)

    issued = await service.admin_login(
        AdminLoginRequest(username="Mushfik324", password="1324"),
        audit,
    )

    payload = service.jwt_service.decode_access_token(issued.access_token)
    assert payload.role is UserRole.ADMIN

    patient = User(
        id=uuid4(),
        username="ordinary-user",
        email="ordinary@example.com",
        password_hash=service.password_hasher.hash("1324"),
        role_id=repository.patient_role.id,
        role=repository.patient_role,
        status=UserStatus.ACTIVE,
    )
    await repository.add_user(patient)
    with pytest.raises(InvalidCredentialsError):
        await service.admin_login(
            AdminLoginRequest(username="ordinary-user", password="1324"),
            audit,
        )
async def test_legacy_pending_user_can_log_in_without_email_verification(
    auth_components: tuple[
        AuthenticationService,
        MemoryAuthRepository,
        CapturingEmailService,
    ],
    audit: AuditContext,
) -> None:
    service, repository, email = auth_components
    user = await register_active_user(service, repository, email, audit)
    user.status = UserStatus.PENDING_VERIFICATION
    user.email_verified_at = None

    issued = await service.login(
        LoginRequest(email=user.email, password="SecurePassword1"),
        audit,
    )

    assert user.status is UserStatus.ACTIVE
    assert user.email_verified_at is not None
    assert issued.access_token
    assert issued.refresh_token


async def test_login_and_refresh_rotate_session(
    auth_components: tuple[
        AuthenticationService,
        MemoryAuthRepository,
        CapturingEmailService,
    ],
    audit: AuditContext,
) -> None:
    service, repository, email = auth_components
    await register_active_user(service, repository, email, audit)

    issued = await service.login(
        LoginRequest(email="patient@example.com", password="SecurePassword1"),
        audit,
    )
    rotated = await service.refresh(
        raw_refresh_token=issued.refresh_token,
        csrf_token=issued.csrf_token,
        audit=audit,
    )

    assert rotated.session_id != issued.session_id
    assert repository.sessions[issued.session_id].revoked_at is not None
    assert repository.sessions[issued.session_id].replaced_by_id == rotated.session_id


async def test_rotated_refresh_token_reuse_revokes_family(
    auth_components: tuple[
        AuthenticationService,
        MemoryAuthRepository,
        CapturingEmailService,
    ],
    audit: AuditContext,
) -> None:
    service, repository, email = auth_components
    await register_active_user(service, repository, email, audit)
    issued = await service.login(
        LoginRequest(email="patient@example.com", password="SecurePassword1"),
        audit,
    )
    await service.refresh(
        raw_refresh_token=issued.refresh_token,
        csrf_token=issued.csrf_token,
        audit=audit,
    )

    with pytest.raises(InvalidCredentialsError):
        await service.refresh(
            raw_refresh_token=issued.refresh_token,
            csrf_token=issued.csrf_token,
            audit=audit,
        )

    family = repository.sessions[issued.session_id].family_id
    assert all(
        session.revoked_at is not None
        for session in repository.sessions.values()
        if session.family_id == family
    )


async def test_forgot_and_reset_password_revoke_sessions(
    auth_components: tuple[
        AuthenticationService,
        MemoryAuthRepository,
        CapturingEmailService,
    ],
    audit: AuditContext,
) -> None:
    service, repository, email = auth_components
    user = await register_active_user(service, repository, email, audit)
    issued = await service.login(
        LoginRequest(email=user.email, password="SecurePassword1"),
        audit,
    )

    await service.forgot_password(user.email, audit)
    assert email.reset_token
    await service.reset_password(
        ResetPasswordRequest(
            token=email.reset_token,
            new_password="DifferentPassword2",
        ),
        audit,
    )

    assert repository.sessions[issued.session_id].revoked_at is not None
    with pytest.raises(InvalidCredentialsError):
        await service.login(
            LoginRequest(email=user.email, password="SecurePassword1"),
            audit,
        )


async def test_change_password_validates_current_password(
    auth_components: tuple[
        AuthenticationService,
        MemoryAuthRepository,
        CapturingEmailService,
    ],
    audit: AuditContext,
) -> None:
    service, repository, email = auth_components
    user = await register_active_user(service, repository, email, audit)

    with pytest.raises(InvalidCredentialsError):
        await service.change_password(
            user=user,
            request=ChangePasswordRequest(
                current_password="incorrect",
                new_password="DifferentPassword2",
            ),
            audit=audit,
        )
