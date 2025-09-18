from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from app.config import settings

def create_token(sub: str, role: str, expires_minutes: int) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": sub,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp())
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALG)

def create_access_refresh(sub: str, role: str) -> tuple[str, str]:
    access_token = create_token(sub, role, settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token = create_token(sub, role, settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60)
    return access_token, refresh_token

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])
    except JWTError as e:
        raise ValueError(f"Invalid token: {e}")
