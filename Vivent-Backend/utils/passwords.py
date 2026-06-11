"""Password hashing helpers."""

from __future__ import annotations

from passlib.context import CryptContext
import hashlib

# Configure bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def normalize_password(password: str) -> str:
    """
    Convert password to a fixed-length string using SHA-256.
    This avoids bcrypt's 72-byte limit safely.
    """
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    """
    Hash a plain-text password after normalization.
    """
    normalized = normalize_password(password)
    return pwd_context.hash(normalized)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a stored hash.
    """
    try:
        normalized = normalize_password(plain_password)
        return pwd_context.verify(normalized, hashed_password)
    except Exception:
        return False