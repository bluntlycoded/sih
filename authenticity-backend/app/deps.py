from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from app.core.jwt import decode_token
from app.db import get_collection
from app.core.roles import Role

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """Decode JWT and return user dict from Firestore."""
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
    """Enforce that current user has one of the allowed roles."""
    async def _role_checker(user: dict = Depends(get_current_user)):
        if user["role"] not in [r.value for r in roles]:
            raise HTTPException(status_code=403, detail="Not enough permissions")
        return user
    return _role_checker
