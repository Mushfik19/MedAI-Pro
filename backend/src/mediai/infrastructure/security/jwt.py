"""Short-lived JWT creation and verification."""

from datetime import UTC, datetime, timedelta
from uuid import UUID, uuid4

import jwt
from pydantic import BaseModel, ConfigDict

from mediai.core.config import Settings
from mediai.core.enums import Permission, TokenType, UserRole
from mediai.shared.domain.exceptions import AuthenticationError


class TokenPayload(BaseModel):
    model_config = ConfigDict(extra="forbid")

    sub: UUID
    sid: UUID
    jti: UUID
    type: TokenType
    role: UserRole
    permissions: frozenset[Permission]
    iss: str
    aud: str
    iat: datetime
    nbf: datetime
    exp: datetime


class JWTService:
    """Encode and verify access tokens using an explicit claim contract."""

    def __init__(self, settings: Settings) -> None:
        self.secret = settings.jwt_secret_key.get_secret_value()
        self.algorithm = settings.jwt_algorithm
        self.issuer = settings.jwt_issuer
        self.audience = settings.jwt_audience
        self.access_ttl = timedelta(minutes=settings.access_token_ttl_minutes)
        self.refresh_ttl = timedelta(days=settings.refresh_token_ttl_days)

    def create_access_token(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
        role: UserRole,
        permissions: frozenset[Permission],
    ) -> str:
        return self._create_token(
            user_id=user_id,
            session_id=session_id,
            role=role,
            permissions=permissions,
            token_type=TokenType.ACCESS,
            ttl=self.access_ttl,
        )

    def create_refresh_token(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
        role: UserRole,
        permissions: frozenset[Permission],
    ) -> str:
        return self._create_token(
            user_id=user_id,
            session_id=session_id,
            role=role,
            permissions=permissions,
            token_type=TokenType.REFRESH,
            ttl=self.refresh_ttl,
        )

    def _create_token(
        self,
        *,
        user_id: UUID,
        session_id: UUID,
        role: UserRole,
        permissions: frozenset[Permission],
        token_type: TokenType,
        ttl: timedelta,
    ) -> str:
        now = datetime.now(UTC)
        payload = TokenPayload(
            sub=user_id,
            sid=session_id,
            jti=uuid4(),
            type=token_type,
            role=role,
            permissions=permissions,
            iss=self.issuer,
            aud=self.audience,
            iat=now,
            nbf=now,
            exp=now + ttl,
        )
        encoded_payload = payload.model_dump(mode="json")
        for claim in ("iat", "nbf", "exp"):
            encoded_payload[claim] = int(getattr(payload, claim).timestamp())
        return jwt.encode(
            encoded_payload,
            self.secret,
            algorithm=self.algorithm,
            headers={"typ": "JWT"},
        )

    def decode_access_token(self, token: str) -> TokenPayload:
        return self._decode_token(token, expected_type=TokenType.ACCESS)

    def decode_refresh_token(self, token: str) -> TokenPayload:
        return self._decode_token(token, expected_type=TokenType.REFRESH)

    def _decode_token(self, token: str, *, expected_type: TokenType) -> TokenPayload:
        try:
            raw_payload = jwt.decode(
                token,
                self.secret,
                algorithms=[self.algorithm],
                audience=self.audience,
                issuer=self.issuer,
                options={"require": ["sub", "sid", "jti", "type", "iat", "nbf", "exp"]},
            )
            payload = TokenPayload.model_validate(raw_payload)
        except (jwt.PyJWTError, ValueError) as error:
            raise AuthenticationError("The access token is invalid or expired.") from error

        if payload.type is not expected_type:
            raise AuthenticationError(
                f"The supplied token is not a valid {expected_type.value} token."
            )
        return payload
