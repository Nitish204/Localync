"""
Security primitives: password hashing and JWT session tokens.

Password handling rules (do not weaken these):
  1. Plaintext passwords are NEVER written to disk, logs, or the database.
     They exist only transiently in request memory during hashing/verification.
  2. Passwords are hashed with bcrypt (via passlib's CryptContext), which is
     salted automatically per-password and includes a configurable work
     factor (`rounds`) to stay slow as hardware improves.
  3. Only the resulting hash (e.g. "$2b$12$...") is stored, in
     User.hashed_password. Login verifies with bcrypt's constant-time
     compare (pwd_context.verify) — we never decrypt a hash back to a
     password, because bcrypt is one-way by design.
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt, JWTError
from passlib.context import CryptContext

# bcrypt work factor. 12 is a reasonable default in 2026; raise it as
# hardware gets faster. Each +1 roughly doubles hashing time.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)

# In production this MUST come from an environment variable / secrets
# manager, never hardcoded. A dev fallback is provided so the app runs
# out of the box.
SECRET_KEY = os.environ.get("LOCALYNC_SECRET_KEY", "dev-only-change-me-before-deploying")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24h


def hash_password(plain_password: str) -> str:
    """One-way bcrypt hash. This is what actually goes in the database."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time comparison of a submitted password against the stored
    bcrypt hash. Returns False on any mismatch — never raises for wrong
    passwords, so callers can't distinguish "wrong password" timing from
    "unknown user" timing."""
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except ValueError:
        return False


def create_access_token(data: dict, expires_minutes: Optional[int] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(
        minutes=expires_minutes or ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
