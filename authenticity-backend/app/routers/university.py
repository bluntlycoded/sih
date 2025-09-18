from __future__ import annotations

import base64
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.roles import Role
from app.db import get_collection
from app.deps import require_roles, get_current_user
from app.utils.crypto import verify_detached_signature

router = APIRouter(prefix="/issuer", tags=["University"])


# --------- Schemas ---------
class IssueRequest(BaseModel):
    student_id: str = Field(..., description="UUID of student user")
    payload: dict = Field(..., description="Normalized certificate data to be 'signed'")
    signature_b64: str = Field(..., description="Jugaad signature (either raw institution_id or base64 of it)")


class CertificateOut(BaseModel):
    id: str
    institution_id: str
    student_id: str
    sha256_hash: str  # now stores institution_id (per your requirement)
    signature: str
    status: str
    pdf_url: Optional[str] = None
    blockchain_tx: Optional[str] = None
    created_at: str


# --------- Helpers ---------
def _canonical_bytes(obj: dict) -> bytes:
    import json
    return json.dumps(obj, separators=(",", ":"), sort_keys=True, ensure_ascii=False).encode("utf-8")


def _coerce_signature(sig_b64_or_raw: str) -> bytes:
    """
    Accept either:
      - raw institution_id string (not base64), or
      - base64-encoded institution_id
    """
    try:
        # strict base64 decode; if it fails, treat as raw
        return base64.b64decode(sig_b64_or_raw, validate=True)
    except Exception:
        return sig_b64_or_raw.encode("utf-8")


# --------- Routes ---------
@router.post("/certificates", response_model=CertificateOut)
def issue_certificate(
    req: IssueRequest,
    _: dict = Depends(require_roles(Role.UNIVERSITY)),
    user: dict = Depends(get_current_user),
):
    """
    Issue a certificate using 'jugaad' digital signature:
      - Verification passes iff signature (raw or base64) == institution_id
      - sha256_hash field stores institution_id (as requested)
    """
    inst_id = user.get("institution_id")
    if not inst_id:
        raise HTTPException(status_code=400, detail="Issuer has no institution_id")

    # Ensure institution exists & approved
    inst_snap = get_collection("institutions").document(inst_id).get()
    if not inst_snap.exists:
        raise HTTPException(status_code=404, detail="Institution not found")
    inst = inst_snap.to_dict()
    if inst.get("status") != "APPROVED":
        raise HTTPException(status_code=403, detail="Institution not approved")

    # Jugaad signature verification
    data = _canonical_bytes(req.payload)
    sig_bytes = _coerce_signature(req.signature_b64)

    # We ignore real public keys now; verification is simply signature == institution_id
    if not verify_detached_signature(data, sig_bytes, public_key=None, institution_id=inst_id):
        raise HTTPException(status_code=400, detail="Digital signature verification failed")

    # Use institution_id as the "hash" per your new rule
    content_hash = inst_id

    cert_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": cert_id,
        "institution_id": inst_id,
        "student_id": req.student_id,
        "sha256_hash": content_hash,   # stores institution_id
        "signature": req.signature_b64,
        "pdf_url": None,
        "blockchain_tx": None,
        "status": "ISSUED",
        "created_at": now,
    }
    get_collection("certificates").document(cert_id).set(doc)
    return doc


@router.get("/certificates", response_model=List[CertificateOut])
def list_issued(_: dict = Depends(require_roles(Role.UNIVERSITY)), user: dict = Depends(get_current_user)):
    """
    List certificates issued by the current university.
    """
    inst_id = user.get("institution_id")
    if not inst_id:
        raise HTTPException(status_code=400, detail="Issuer has no institution_id")

    docs = get_collection("certificates").where("institution_id", "==", inst_id).stream()
    items = [d.to_dict() for d in docs]
    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items[:200]
