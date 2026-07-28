"""Authentication application service and security-sensitive workflows."""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from uuid import UUID, uuid4

from mediai.core.config import Settings
from mediai.core.enums import (
    AuditOutcome,
    UserRole,
    UserStatus,
    VerificationPurpose,
)
from mediai.features.auth.domain import AuditContext, EmailService, IssuedSession
from mediai.features.auth.models import (
    AuditLog,
    RefreshSession,
    User,
    UserConsent,
    UserProfile,
    VerificationToken,
)
from mediai.features.auth.repository import AuthRepository
from mediai.features.auth.schemas import (
    AdminLoginRequest,
    ChangePasswordRequest,
    CurrentUserResponse,
    LoginRequest,
    RegisterRequest,
    RegistrationResponse,
    ResetPasswordRequest,
)
from mediai.infrastructure.security.jwt import JWTService
from mediai.infrastructure.security.passwords import PasswordHasher
from mediai.shared.domain.exceptions import (
    AccountUnavailableError,
    ConflictError,
    InfrastructureUnavailableError,
    InvalidCredentialsError,
    InvalidTokenError,
)
from mediai.shared.utils.time import utc_now


class AuthenticationService:
    """Coordinate identity workflows with explicit persistence and delivery ports."""

    def __init__(
        self,
        *,
        repository: AuthRepository,
        email_service: EmailService,
        password_hasher: PasswordHasher,
        jwt_service: JWTService,
        settings: Settings,
    ) -> None:
        self.repository = repository
        self.email_service = email_service
        self.password_hasher = password_hasher
        self.jwt_service = jwt_service
        self.settings = settings

    async def register(
        self,
        request: RegisterRequest,
        audit: AuditContext,
    ) -> RegistrationResponse:
        existing = await self.repository.get_user_by_email(str(request.email))
        if existing is not None:
            await self._audit(
                actor_id=existing.id,
                action="auth.registration_rejected",
                resource_id=existing.id,
                outcome=AuditOutcome.DENIED,
                audit=audit,
            )
            raise ConflictError("An account with this email already exists.")

        patient_role = await self.repository.get_role(UserRole.PATIENT)
        if patient_role is None:
            raise InfrastructureUnavailableError("authorization policy")

        now = utc_now()
        user = User(
            email=str(request.email),
            password_hash=self.password_hasher.hash(request.password),
            role_id=patient_role.id,
            role=patient_role,
            status=UserStatus.ACTIVE,
            email_verified_at=now,
            password_changed_at=now,
            profile=UserProfile(
                display_name=request.display_name,
                timezone=request.timezone,
            ),
        )
        await self.repository.add_user(user)
        for document_id in request.consent_document_ids:
            self.repository.session.add(
                UserConsent(
                    user_id=user.id,
                    document_id=document_id,
                    accepted_at=now,
                )
            )

        await self._audit(
            actor_id=user.id,
            action="auth.user_registered",
            resource_id=user.id,
            outcome=AuditOutcome.SUCCESS,
            audit=audit,
            changes={"role": UserRole.PATIENT.value},
        )
        return RegistrationResponse(user_id=user.id)

    async def login(
        self,
        request: LoginRequest,
        audit: AuditContext,
    ) -> IssuedSession:
        user = await self.repository.get_user_by_email(str(request.email))
        return await self._authenticate(
            user=user,
            password=request.password,
            audit=audit,
            required_role=None,
        )

    async def admin_login(
        self,
        request: AdminLoginRequest,
        audit: AuditContext,
    ) -> IssuedSession:
        user = await self.repository.get_user_by_username(request.username)
        return await self._authenticate(
            user=user,
            password=request.password,
            audit=audit,
            required_role=UserRole.ADMIN,
        )

    async def _authenticate(
        self,
        *,
        user: User | None,
        password: str,
        audit: AuditContext,
        required_role: UserRole | None,
    ) -> IssuedSession:
        if user is None:
            self.password_hasher.verify_unknown_user(password)
            await self._audit(
                actor_id=None,
                action="auth.login_failed",
                resource_id=None,
                outcome=AuditOutcome.DENIED,
                audit=audit,
                changes={"reason": "invalid_credentials"},
            )
            await self.repository.session.commit()
            raise InvalidCredentialsError()

        if not self.password_hasher.verify(password, user.password_hash):
            await self._audit(
                actor_id=user.id,
                action="auth.login_failed",
                resource_id=user.id,
                outcome=AuditOutcome.DENIED,
                audit=audit,
                changes={"reason": "invalid_credentials"},
            )
            await self.repository.session.commit()
            raise InvalidCredentialsError()

        if required_role is not None and user.role.name is not required_role:
            await self._audit(
                actor_id=user.id,
                action="auth.login_failed",
                resource_id=user.id,
                outcome=AuditOutcome.DENIED,
                audit=audit,
                changes={"reason": "role_not_allowed"},
            )
            await self.repository.session.commit()
            raise InvalidCredentialsError()

        if user.status is UserStatus.PENDING_VERIFICATION:
            user.status = UserStatus.ACTIVE
            user.email_verified_at = user.email_verified_at or utc_now()
        if user.status is not UserStatus.ACTIVE:
            raise AccountUnavailableError("This account is not available for sign-in.")

        issued = await self._issue_session(
            user=user,
            audit=audit,
            family_id=uuid4(),
        )
        user.last_login_at = utc_now()
        await self._audit(
            actor_id=user.id,
            action="auth.login_succeeded",
            resource_id=issued.session_id,
            outcome=AuditOutcome.SUCCESS,
            audit=audit,
        )
        return issued

    async def refresh(
        self,
        *,
        raw_refresh_token: str,
        csrf_token: str,
        audit: AuditContext,
    ) -> IssuedSession:
        payload = self.jwt_service.decode_refresh_token(raw_refresh_token)
        now = utc_now()
        current = await self.repository.get_session_for_update(payload.sid)
        if current is None:
            raise InvalidCredentialsError("The refresh session is invalid.")

        token_matches = hmac.compare_digest(
            current.token_hash,
            self._token_hash(raw_refresh_token),
        )
        csrf_matches = hmac.compare_digest(current.csrf_hash, self._token_hash(csrf_token))
        session_active = current.revoked_at is None and current.expires_at > now
        if not token_matches or not csrf_matches or not session_active:
            await self.repository.revoke_family(current.family_id, now)
            await self._audit(
                actor_id=current.user_id,
                action="auth.refresh_reuse_detected",
                resource_id=current.id,
                outcome=AuditOutcome.DENIED,
                audit=audit,
            )
            await self.repository.session.commit()
            raise InvalidCredentialsError("The refresh session is invalid.")

        user = await self.repository.get_user_by_id(current.user_id)
        if user is None or user.status is not UserStatus.ACTIVE:
            await self.repository.revoke_family(current.family_id, now)
            raise InvalidCredentialsError("The refresh session is invalid.")

        replacement = await self._issue_session(
            user=user,
            audit=audit,
            family_id=current.family_id,
        )
        current.revoked_at = now
        current.last_used_at = now
        current.replaced_by_id = replacement.session_id
        await self._audit(
            actor_id=user.id,
            action="auth.refresh_rotated",
            resource_id=replacement.session_id,
            outcome=AuditOutcome.SUCCESS,
            audit=audit,
        )
        return replacement

    async def logout(self, user_id: UUID, session_id: UUID, audit: AuditContext) -> None:
        await self.repository.revoke_session(session_id, utc_now())
        await self._audit(
            actor_id=user_id,
            action="auth.logout",
            resource_id=session_id,
            outcome=AuditOutcome.SUCCESS,
            audit=audit,
        )

    async def forgot_password(self, email: str, audit: AuditContext) -> None:
        user = await self.repository.get_user_by_email(email)
        if user is None or user.status is UserStatus.DEACTIVATED:
            await self._audit(
                actor_id=None,
                action="auth.password_reset_requested",
                resource_id=None,
                outcome=AuditOutcome.SUCCESS,
                audit=audit,
            )
            return

        now = utc_now()
        await self.repository.consume_open_tokens(
            user_id=user.id,
            purpose=VerificationPurpose.PASSWORD_RESET,
            consumed_at=now,
        )
        raw_token, expires_at = await self._issue_one_time_token(
            user_id=user.id,
            purpose=VerificationPurpose.PASSWORD_RESET,
            ttl=timedelta(minutes=self.settings.password_reset_token_ttl_minutes),
        )
        await self.email_service.queue_password_reset(
            recipient=user.email,
            display_name=user.profile.display_name,
            token=raw_token,
            expires_at=expires_at,
        )
        await self._audit(
            actor_id=user.id,
            action="auth.password_reset_requested",
            resource_id=user.id,
            outcome=AuditOutcome.SUCCESS,
            audit=audit,
        )

    async def reset_password(
        self,
        request: ResetPasswordRequest,
        audit: AuditContext,
    ) -> None:
        now = utc_now()
        token = await self.repository.get_verification_token_for_update(
            self._token_hash(request.token),
            VerificationPurpose.PASSWORD_RESET,
        )
        if token is None or token.consumed_at is not None or token.expires_at <= now:
            raise InvalidTokenError()
        user = await self.repository.get_user_by_id(token.user_id)
        if user is None or user.status is UserStatus.DEACTIVATED:
            raise InvalidTokenError()
        if self.password_hasher.verify(request.new_password, user.password_hash):
            raise ConflictError("The new password must differ from the current password.")

        user.password_hash = self.password_hasher.hash(request.new_password)
        user.password_changed_at = now
        await self.repository.consume_open_tokens(
            user_id=user.id,
            purpose=VerificationPurpose.PASSWORD_RESET,
            consumed_at=now,
        )
        await self.repository.revoke_user_sessions(user.id, now)
        await self._audit(
            actor_id=user.id,
            action="auth.password_reset_completed",
            resource_id=user.id,
            outcome=AuditOutcome.SUCCESS,
            audit=audit,
        )

    async def change_password(
        self,
        *,
        user: User,
        request: ChangePasswordRequest,
        audit: AuditContext,
    ) -> None:
        if not self.password_hasher.verify(request.current_password, user.password_hash):
            raise InvalidCredentialsError("The current password is incorrect.")
        if self.password_hasher.verify(request.new_password, user.password_hash):
            raise ConflictError("The new password must differ from the current password.")

        now = utc_now()
        user.password_hash = self.password_hasher.hash(request.new_password)
        user.password_changed_at = now
        await self.repository.revoke_user_sessions(user.id, now)
        await self._audit(
            actor_id=user.id,
            action="auth.password_changed",
            resource_id=user.id,
            outcome=AuditOutcome.SUCCESS,
            audit=audit,
        )

    @staticmethod
    def current_user_response(user: User) -> CurrentUserResponse:
        return CurrentUserResponse(
            id=user.id,
            email=user.email,
            display_name=user.profile.display_name,
            role=user.role.name,
            status=user.status,
            permissions=sorted(
                (item.code for item in user.role.permissions),
                key=str,
            ),
            email_verified=user.email_verified_at is not None,
        )

    async def _issue_one_time_token(
        self,
        *,
        user_id: UUID,
        purpose: VerificationPurpose,
        ttl: timedelta,
    ) -> tuple[str, datetime]:
        now = utc_now()
        raw_token = secrets.token_urlsafe(48)
        expires_at = now + ttl
        await self.repository.add_verification_token(
            VerificationToken(
                user_id=user_id,
                purpose=purpose,
                token_hash=self._token_hash(raw_token),
                expires_at=expires_at,
                created_at=now,
            )
        )
        return raw_token, expires_at

    async def _issue_session(
        self,
        *,
        user: User,
        audit: AuditContext,
        family_id: UUID,
    ) -> IssuedSession:
        now = utc_now()
        session_id = uuid4()
        permissions = frozenset(item.code for item in user.role.permissions)
        access_token = self.jwt_service.create_access_token(
            user_id=user.id,
            session_id=session_id,
            role=user.role.name,
            permissions=permissions,
        )
        refresh_token = self.jwt_service.create_refresh_token(
            user_id=user.id,
            session_id=session_id,
            role=user.role.name,
            permissions=permissions,
        )
        refresh_payload = self.jwt_service.decode_refresh_token(refresh_token)
        csrf_token = secrets.token_urlsafe(32)
        await self.repository.add_session(
            RefreshSession(
                id=session_id,
                user_id=user.id,
                family_id=family_id,
                token_jti=refresh_payload.jti,
                token_hash=self._token_hash(refresh_token),
                csrf_hash=self._token_hash(csrf_token),
                expires_at=now + self.jwt_service.refresh_ttl,
                ip_hash=audit.ip_hash,
                user_agent=audit.user_agent,
            )
        )
        return IssuedSession(
            access_token=access_token,
            refresh_token=refresh_token,
            csrf_token=csrf_token,
            access_expires_in=int(self.jwt_service.access_ttl.total_seconds()),
            session_id=session_id,
        )

    async def _audit(
        self,
        *,
        actor_id: UUID | None,
        action: str,
        resource_id: UUID | None,
        outcome: AuditOutcome,
        audit: AuditContext,
        changes: dict[str, str] | None = None,
    ) -> None:
        await self.repository.add_audit_log(
            AuditLog(
                actor_id=actor_id,
                action=action,
                resource_type="authentication",
                resource_id=resource_id,
                outcome=outcome,
                request_id=audit.request_id,
                ip_hash=audit.ip_hash,
                user_agent=audit.user_agent,
                changes=changes or {},
                created_at=utc_now(),
            )
        )

    @staticmethod
    def _token_hash(raw_token: str) -> str:
        return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
