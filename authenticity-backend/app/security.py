from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.core.jwt import decode_token, create_access_refresh
from app.core.password import hash_password, verify_password
from app.core.roles import Role
from app.db import get_collection

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Extract user info from JWT and Firestore."""
    try:
        payload = decode_token(token)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")

    doc = get_collection("users").document(user_id).get()
    if not doc.exists:
        raise HTTPException(status_code=401, detail="User not found")

    user = doc.to_dict()
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="User is inactive")

    return user


def require_roles(*roles: Role):
    """Dependency that enforces role-based access."""
    async def _role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in [r.value for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions",
            )
        return user
    return _role_checker


# --- Utility wrappers for consistency ---
def create_tokens(user_id: str, role: str):
    """Return (access, refresh) tokens."""
    return create_access_refresh(user_id, role)


def hash_user_password(password: str) -> str:
    """Hash a raw password for storage."""
    return hash_password(password)


def verify_user_password(password: str, hashed: str) -> bool:
    """Verify a password against stored hash."""
    return verify_password(password, hashed)
