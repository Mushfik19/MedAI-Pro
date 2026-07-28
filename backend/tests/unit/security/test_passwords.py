"""Password hashing contract tests."""

from mediai.infrastructure.security.passwords import PasswordHasher


def test_password_hasher_round_trip() -> None:
    hasher = PasswordHasher()
    password_hash = hasher.hash("Correct-Horse-Battery-Staple-2026")

    assert password_hash != "Correct-Horse-Battery-Staple-2026"
    assert hasher.verify("Correct-Horse-Battery-Staple-2026", password_hash)
    assert not hasher.verify("incorrect", password_hash)
