import uuid
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.core.password import verify_password, hash_password
from app.core.jwt import create_access_refresh, decode_token
from app.core.roles import Role
from app.db import get_collection

class AuthService:
    @staticmethod
    def get_user_by_email(email: str):
        docs = list(get_collection("users").where("email", "==", email).limit(1).stream())
        return docs[0].to_dict() if docs else None

    @staticmethod
    def login(email: str, password: str):
        user = AuthService.get_user_by_email(email)
        if not user or not user.get("is_active", True):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        if not verify_password(password, user["password_hash"]):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
        return create_access_refresh(user["id"], user["role"])

    @staticmethod
    def refresh_token(refresh_token: str):
        try:
            payload = decode_token(refresh_token)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid refresh token")
        sub, role = payload.get("sub"), payload.get("role")
        return create_access_refresh(sub, role)

    @staticmethod
    def register_admin(email: str, password: str):
        existing = AuthService.get_user_by_email(email)
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": user_id,
            "email": email,
            "password_hash": hash_password(password),
            "role": Role.ADMIN.value,
            "institution_id": None,
            "is_active": True,
            "created_at": now,
        }
        get_collection("users").document(user_id).set(doc)
        return doc
