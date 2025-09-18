from __future__ import annotations
from typing import Any, Dict, Optional, Literal
from pydantic import BaseModel, EmailStr, field_validator

# ---------- Common literals ----------
Role = Literal["ADMIN", "UNIVERSITY", "STUDENT"]
InstitutionStatus = Literal["PENDING", "APPROVED", "REVOKED"]
CertificateStatus = Literal["ISSUED", "ANCHORED", "REVOKED"]
VerificationVerdict = Literal["VERIFIED", "TAMPERED", "NOT_FOUND"]

# ---------- Auth ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenPair(BaseModel):
    access_token: str
    refresh_token: str
    token_type: Literal["bearer"] = "bearer"

class RefreshRequest(BaseModel):
    refresh_token: str

class RegisterAdminRequest(BaseModel):
    email: EmailStr
    password: str
    bootstrap_secret: str

# ---------- Users ----------
class UserOut(BaseModel):
    id: str
    email: EmailStr
    role: Role
    institution_id: Optional[str] = None
    is_active: bool = True
    created_at: Optional[str] = None

# ---------- Institutions ----------
class InstitutionCreate(BaseModel):
    name: str
    public_key_pem: Optional[str] = None

class InstitutionKeyUpdate(BaseModel):
    public_key_pem: str

class InstitutionOut(BaseModel):
    id: str
    name: str
    status: InstitutionStatus
    public_key_pem: Optional[str] = None
    created_at: str

# ---------- Certificates / Issuance ----------
class IssueRequest(BaseModel):
    student_id: str
    payload: Dict[str, Any]
    signature_b64: str

    @field_validator("payload")
    @classmethod
    def ensure_payload_nonempty(cls, v: Dict[str, Any]) -> Dict[str, Any]:
        if not isinstance(v, dict) or not v:
            raise ValueError("payload must be a non-empty JSON object")
        return v

class CertificateOut(BaseModel):
    id: str
    institution_id: str
    student_id: str
    sha256_hash: str
    signature: str
    status: CertificateStatus
    pdf_url: Optional[str] = None
    blockchain_tx: Optional[str] = None
    created_at: str

# ---------- Student ----------
class StudentCertificateOut(CertificateOut):
    share_url: Optional[str] = None

# ---------- Public Verify ----------
class VerifyResponse(BaseModel):
    status: VerificationVerdict
    reason: Optional[str] = None
    certificate: Optional[CertificateOut | Dict[str, Any]] = None
