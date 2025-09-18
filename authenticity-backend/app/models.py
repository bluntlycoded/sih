import uuid
from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field

# ---------- Type Aliases ----------
Role = Literal["ADMIN", "UNIVERSITY", "STUDENT"]
InstitutionStatus = Literal["PENDING", "APPROVED", "REVOKED"]
CertificateStatus = Literal["ISSUED", "ANCHORED", "REVOKED"]
VerificationVerdict = Literal["VERIFIED", "TAMPERED", "NOT_FOUND"]

# ---------- User ----------
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    password_hash: str
    role: Role
    institution_id: Optional[str] = None
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# ---------- Institution ----------
class Institution(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    public_key_pem: Optional[str] = None
    status: InstitutionStatus = "PENDING"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# ---------- Certificate ----------
class Certificate(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    institution_id: str
    student_id: str
    sha256_hash: str
    signature: str
    pdf_url: Optional[str] = None
    blockchain_tx: Optional[str] = None
    status: CertificateStatus = "ISSUED"
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# ---------- Verification Event ----------
class VerificationEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    certificate_id: str
    verdict: VerificationVerdict
    ip: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
