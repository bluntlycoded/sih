import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional

from app.security import require_roles, hash_user_password
from app.core.roles import Role
from app.db import get_collection
from app.schemas import InstitutionCreate, InstitutionKeyUpdate, InstitutionOut, UserOut


router = APIRouter(prefix="/admin", tags=["Admin"])


# ---------- Pydantic request models ----------
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str  # "ADMIN", "UNIVERSITY", or "STUDENT"
    institution_id: Optional[str] = None


# ---------- Institutions ----------
@router.post("/institutions", response_model=InstitutionOut)
def create_institution(req: InstitutionCreate, _: dict = Depends(require_roles(Role.ADMIN))):
    institutions = get_collection("institutions")
    inst_id = str(uuid.uuid4())
    data = {
        "id": inst_id,
        "name": req.name,
        "public_key_pem": req.public_key_pem,
        "status": "PENDING",
        "created_at": datetime.utcnow().isoformat(),
    }
    institutions.document(inst_id).set(data)
    return data


@router.get("/institutions", response_model=list[InstitutionOut])
def list_institutions(_: dict = Depends(require_roles(Role.ADMIN))):
    institutions = get_collection("institutions")
    docs = institutions.stream()
    return [doc.to_dict() for doc in docs]


@router.post("/institutions/{inst_id}/approve")
def approve_institution(inst_id: str, _: dict = Depends(require_roles(Role.ADMIN))):
    institutions = get_collection("institutions")
    doc = institutions.document(inst_id).get()
    if not doc.exists:
        raise HTTPException(404, "Institution not found")
    institutions.document(inst_id).update({"status": "APPROVED"})
    return {"id": inst_id, "status": "APPROVED"}


@router.post("/institutions/{inst_id}/revoke")
def revoke_institution(inst_id: str, _: dict = Depends(require_roles(Role.ADMIN))):
    institutions = get_collection("institutions")
    doc = institutions.document(inst_id).get()
    if not doc.exists:
        raise HTTPException(404, "Institution not found")
    institutions.document(inst_id).update({"status": "REVOKED"})
    return {"id": inst_id, "status": "REVOKED"}


@router.put("/institutions/{inst_id}/key")
def update_institution_key(inst_id: str, req: InstitutionKeyUpdate, _: dict = Depends(require_roles(Role.ADMIN))):
    institutions = get_collection("institutions")
    doc = institutions.document(inst_id).get()
    if not doc.exists:
        raise HTTPException(404, "Institution not found")
    institutions.document(inst_id).update({"public_key_pem": req.public_key_pem})
    return {"id": inst_id, "public_key_pem": req.public_key_pem}


# ---------- Users ----------
@router.post("/users", response_model=UserOut)
def create_user(req: UserCreate, _: dict = Depends(require_roles(Role.ADMIN))):
    users = get_collection("users")

    # prevent duplicate email
    existing = users.where("email", "==", req.email).limit(1).stream()
    for _ in existing:
        raise HTTPException(status_code=400, detail="User already exists")

    uid = str(uuid.uuid4())
    user_doc = {
        "id": uid,
        "email": req.email,
        "password_hash": hash_user_password(req.password),
        "role": req.role,  # store as plain string
        "institution_id": req.institution_id,
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
    }
    users.document(uid).set(user_doc)

    return {
        "id": uid,
        "email": req.email,
        "role": req.role,
        "institution_id": req.institution_id,
        "is_active": True,
        "created_at": user_doc["created_at"],
    }


@router.get("/users", response_model=list[UserOut])
def list_users(_: dict = Depends(require_roles(Role.ADMIN))):
    users = get_collection("users")
    docs = users.stream()
    return [
        {
            **doc.to_dict(),
            "role": str(doc.to_dict().get("role")),  # ensure role is always a string
        }
        for doc in docs
    ]


@router.post("/users/{user_id}/deactivate")
def deactivate_user(user_id: str, _: dict = Depends(require_roles(Role.ADMIN))):
    users = get_collection("users")
    doc = users.document(user_id).get()
    if not doc.exists:
        raise HTTPException(404, "User not found")
    users.document(user_id).update({"is_active": False})
    return {"id": user_id, "is_active": False}


@router.post("/users/{user_id}/activate")
def activate_user(user_id: str, _: dict = Depends(require_roles(Role.ADMIN))):
    users = get_collection("users")
    doc = users.document(user_id).get()
    if not doc.exists:
        raise HTTPException(404, "User not found")
    users.document(user_id).update({"is_active": True})
    return {"id": user_id, "is_active": True}
