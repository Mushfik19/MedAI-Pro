from uuid import uuid4

import pytest

from mediai.core.config import Settings
from mediai.core.enums import Permission, UserRole
from mediai.infrastructure.security.jwt import JWTService
from mediai.shared.domain.exceptions import AuthenticationError


def test_access_token_round_trip(settings: Settings) -> None:
    service = JWTService(settings)
    user_id = uuid4()
    session_id = uuid4()

    token = service.create_access_token(
        user_id=user_id,
        session_id=session_id,
        role=UserRole.PATIENT,
        permissions=frozenset({Permission.PREDICTION_READ}),
    )
    payload = service.decode_access_token(token)

    assert payload.sub == user_id
    assert payload.sid == session_id
    assert payload.role is UserRole.PATIENT
    assert payload.permissions == frozenset({Permission.PREDICTION_READ})


def test_invalid_access_token_is_rejected(settings: Settings) -> None:
    service = JWTService(settings)
    with pytest.raises(AuthenticationError):
        service.decode_access_token("not-a-jwt")


def test_refresh_token_cannot_be_used_as_access_token(settings: Settings) -> None:
    service = JWTService(settings)
    token = service.create_refresh_token(
        user_id=uuid4(),
        session_id=uuid4(),
        role=UserRole.PATIENT,
        permissions=frozenset({Permission.PROFILE_MANAGE}),
    )

    with pytest.raises(AuthenticationError):
        service.decode_access_token(token)

    assert service.decode_refresh_token(token).type.value == "refresh"
