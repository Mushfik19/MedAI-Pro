"""Strict authentication request and response contracts."""

from typing import Annotated
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from pydantic import (
    AfterValidator,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    StringConstraints,
    field_validator,
)

from mediai.core.enums import Permission, UserRole, UserStatus


def validate_password_strength(value: str) -> str:
    if not any(character.islower() for character in value):
        raise ValueError("password must contain a lowercase letter")
    if not any(character.isupper() for character in value):
        raise ValueError("password must contain an uppercase letter")
    if not any(character.isdigit() for character in value):
        raise ValueError("password must contain a number")
    return value


Password = Annotated[
    str,
    StringConstraints(
        min_length=10,
        max_length=128,
        strip_whitespace=False,
    ),
    AfterValidator(validate_password_strength),
]
OpaqueToken = Annotated[str, StringConstraints(min_length=32, max_length=2_048)]


class StrictSchema(BaseModel):
    model_config = ConfigDict(extra="forbid")


class RegisterRequest(StrictSchema):
    email: EmailStr
    password: Password
    display_name: str = Field(min_length=2, max_length=120)
    timezone: str = Field(default="UTC", min_length=1, max_length=64)
    consent_document_ids: list[UUID] = Field(default_factory=list, max_length=20)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("display_name")
    @classmethod
    def normalize_display_name(cls, value: str) -> str:
        return " ".join(value.split())

    @field_validator("timezone")
    @classmethod
    def validate_timezone(cls, value: str) -> str:
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError as error:
            raise ValueError("timezone must be a valid IANA timezone") from error
        return value


class RegistrationResponse(StrictSchema):
    user_id: UUID


class LoginRequest(StrictSchema):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class AdminLoginRequest(StrictSchema):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=1, max_length=128)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip().lower()


class AuthenticatedResponse(StrictSchema):
    status: str = "AUTHENTICATED"
    access_token: str
    token_type: str = "bearer"  # noqa: S105
    expires_in: int
    csrf_token: str


class RefreshResponse(StrictSchema):
    access_token: str
    token_type: str = "bearer"  # noqa: S105
    expires_in: int
    csrf_token: str


class ForgotPasswordRequest(StrictSchema):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class AcceptedResponse(StrictSchema):
    accepted: bool = True


class ResetPasswordRequest(StrictSchema):
    token: OpaqueToken
    new_password: Password


class ChangePasswordRequest(StrictSchema):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: Password


class CurrentUserResponse(StrictSchema):
    id: UUID
    email: EmailStr
    display_name: str
    role: UserRole
    status: UserStatus
    permissions: list[Permission]
    email_verified: bool
