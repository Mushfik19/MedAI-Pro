"""Argon2 password hashing infrastructure for the future authentication feature."""

from pwdlib import PasswordHash


class PasswordHasher:
    """Hash and verify passwords without exposing algorithm details to features."""

    def __init__(self) -> None:
        self._hasher = PasswordHash.recommended()
        self._dummy_hash = self._hasher.hash("MediAI-dummy-password-never-used")

    def hash(self, password: str) -> str:
        return self._hasher.hash(password)

    def verify(self, password: str, password_hash: str) -> bool:
        try:
            return self._hasher.verify(password, password_hash)
        except (TypeError, ValueError):
            return False

    def verify_unknown_user(self, password: str) -> None:
        """Consume the normal verification path to reduce account-enumeration timing leaks."""

        self._hasher.verify(password, self._dummy_hash)
