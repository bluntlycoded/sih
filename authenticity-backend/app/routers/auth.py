from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from datetime import datetime, timezone
from typing import Literal
import uuid

from app.core.password import verify_password, hash_password
from app.core.jwt import create_access_refresh, decode_token
from app.core.roles import Role
from app.config import settings
from app.db import get_collection

router = APIRouter(prefix="/auth", tags=["Auth"])


# ---------- Schemas ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"


class LoginResponse(TokenPair):
    role: str
    email: str


class RefreshRequest(BaseModel):
    refresh_token: str


class RegisterAdminRequest(BaseModel):
    email: EmailStr
    password: str
    bootstrap_secret: str


# ---------- Helpers ----------
def _get_user_by_email(email: str):
    users = get_collection("users")
    docs = list(users.where("email", "==", email).limit(1).stream())
    return docs[0].to_dict() if docs else None


# ---------- Routes ----------
@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest):
    user = _get_user_by_email(payload.email)
    if not user or not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    if not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    access, refresh = create_access_refresh(user["id"], user["role"])
    return LoginResponse(
        access_token=access,
        refresh_token=refresh,
        role=user["role"],     # ✅ now frontend gets role
        email=user["email"],   # ✅ and email
    )


@router.post("/refresh", response_model=LoginResponse)
def refresh(req: RefreshRequest):
    try:
        payload = decode_token(req.refresh_token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    sub, role = payload.get("sub"), payload.get("role")
    access, refresh_tok = create_access_refresh(sub, role)

    # Fetch email from DB for completeness
    user_doc = get_collection("users").document(sub).get()
    if not user_doc.exists:
        raise HTTPException(status_code=404, detail="User not found")
    user = user_doc.to_dict()

    return LoginResponse(
        access_token=access,
        refresh_token=refresh_tok,
        role=role,
        email=user["email"],
    )


@router.post("/register-admin")
def register_admin(req: RegisterAdminRequest):
    if req.bootstrap_secret != settings.BOOTSTRAP_ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Invalid bootstrap secret"
        )

    existing = _get_user_by_email(req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already in use"
        )

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": user_id,
        "email": req.email,
        "password_hash": hash_password(req.password),
        "role": Role.ADMIN.value,
        "institution_id": None,
        "is_active": True,
        "created_at": now,
    }
    get_collection("users").document(user_id).set(doc)

    return {
        "id": user_id,
        "email": req.email,
        "role": Role.ADMIN.value,
        "created_at": now,
    }
