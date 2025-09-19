# app/routers/university.py
from __future__ import annotations

import base64
import uuid
import os
import shutil
import hashlib
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from pydantic import BaseModel, EmailStr
from google.cloud import vision
from web3 import Web3

from app.core.roles import Role
from app.db import get_collection
from app.deps import require_roles, get_current_user
from app.utils.crypto import verify_detached_signature
from app.security import hash_user_password
from app.config import settings

# All endpoints here will be under /issuer/*
router = APIRouter(prefix="/issuer", tags=["University"])

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# --------- Schemas ---------
class CertificateOut(BaseModel):
    id: str
    institution_id: str
    student_id: str
    sha256_hash: str
    ocr_hash: Optional[str] = None
    signature: str
    status: str
    certificate_name: Optional[str] = None
    image_url: Optional[str] = None
    payload: dict
    pdf_url: Optional[str] = None
    blockchain_tx: Optional[str] = None
    created_at: str


class StudentOut(BaseModel):
    id: str
    reg_number: str
    name: str
    program: str
    email: str
    institution_id: str
    created_at: Optional[str] = None
    is_active: Optional[bool] = True


class StudentCreate(BaseModel):
    reg_number: str
    name: str
    program: str
    email: EmailStr
    password: str


# --------- Helpers ---------
def _canonical_bytes(obj: dict) -> bytes:
    import json
    return json.dumps(
        obj, separators=(",", ":"), sort_keys=True, ensure_ascii=False
    ).encode("utf-8")


def _coerce_signature(sig_b64_or_raw: str) -> bytes:
    try:
        return base64.b64decode(sig_b64_or_raw, validate=True)
    except Exception:
        return sig_b64_or_raw.encode("utf-8")


def _make_absolute_url(request: Request, path: str) -> str:
    """Ensure image_url/pdf_url are absolute URLs"""
    base_url = str(request.base_url).rstrip("/")  # e.g. http://localhost:8000
    if path.startswith("http://") or path.startswith("https://"):
        return path
    if not path.startswith("/"):
        path = "/" + path
    return f"{base_url}{path}"


def _ocr_and_hash_image(image_bytes: bytes) -> str:
    """Run OCR on image bytes and return SHA256 hash of normalized text."""
    client = vision.ImageAnnotatorClient()
    image = vision.Image(content=image_bytes)
    response = client.text_detection(image=image)

    if response.error.message:
        raise RuntimeError(f"Vision API error: {response.error.message}")

    texts = response.text_annotations
    text = texts[0].description if texts else ""
    normalized = " ".join(text.strip().lower().split())
    return hashlib.sha256(normalized.encode("utf-8")).hexdigest()


def _push_to_blockchain(cert_id: str, ocr_hash: str) -> str:
    """Send OCR hash + cert_id to blockchain and return tx hash."""
    try:
        w3 = Web3(Web3.HTTPProvider(settings.BLOCKCHAIN_RPC_URL))
        acct = w3.eth.account.from_key(settings.BLOCKCHAIN_PRIVATE_KEY)

        tx = {
            "nonce": w3.eth.get_transaction_count(acct.address),
            "to": acct.address,  # self-send (placeholder; can be smart contract later)
            "value": 0,
            "gas": 200000,
            "gasPrice": w3.eth.gas_price,
            "chainId": int(settings.BLOCKCHAIN_CHAIN_ID),
            "data": Web3.to_bytes(text=f"{cert_id}:{ocr_hash}"),
        }

        signed = acct.sign_transaction(tx)

        # ✅ correct usage in web3.py 6.x
        tx_hash = w3.eth.send_raw_transaction(signed.rawTransaction)

        return w3.to_hex(tx_hash)
    except Exception as e:
        raise RuntimeError(f"Blockchain push failed: {e}")


# --------- Certificate Routes ---------
@router.post("/certificates", response_model=CertificateOut)
async def issue_certificate(
    student_id: str = Form(...),
    certificate_name: str = Form(...),
    payload: str = Form(...),
    signature_b64: str = Form(...),
    image: UploadFile = File(...),
    request: Request = None,   # ✅ to build absolute URLs
    _: dict = Depends(require_roles(Role.UNIVERSITY)),
    user: dict = Depends(get_current_user),
):
    """University issues a certificate with a name + image file + blockchain tx"""
    inst_id = user.get("institution_id")
    if not inst_id:
        raise HTTPException(status_code=400, detail="Issuer has no institution_id")

    # Validate institution
    inst_snap = get_collection("institutions").document(inst_id).get()
    if not inst_snap.exists:
        raise HTTPException(status_code=404, detail="Institution not found")
    inst = inst_snap.to_dict()
    if inst.get("status") != "APPROVED":
        raise HTTPException(status_code=403, detail="Institution not approved")

    # Parse payload
    import json
    try:
        payload_obj = json.loads(payload)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid payload JSON")

    # Signature check
    data = _canonical_bytes(payload_obj)
    sig_bytes = _coerce_signature(signature_b64)
    if not verify_detached_signature(
        data, sig_bytes, public_key=None, institution_id=inst_id
    ):
        raise HTTPException(status_code=400, detail="Digital signature verification failed")

    # Save uploaded image
    file_ext = os.path.splitext(image.filename)[-1]
    file_name = f"{uuid.uuid4()}{file_ext}"
    file_path = os.path.join(UPLOAD_DIR, file_name)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # OCR + hash
    with open(file_path, "rb") as f:
        image_bytes = f.read()
    try:
        ocr_hash = _ocr_and_hash_image(image_bytes)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR failed: {e}")

    # Certificate ID
    cert_id = str(uuid.uuid4())

    # Blockchain push
    try:
        blockchain_tx = _push_to_blockchain(cert_id, ocr_hash)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    # Build absolute URL for image
    image_url = _make_absolute_url(request, f"/uploads/{file_name}")

    # Save certificate record
    now = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": cert_id,
        "institution_id": inst_id,
        "student_id": student_id,
        "sha256_hash": inst_id,  # old fallback check
        "ocr_hash": ocr_hash,
        "signature": signature_b64,
        "status": "ISSUED",
        "certificate_name": certificate_name,
        "image_url": image_url,
        "payload": payload_obj,
        "pdf_url": None,
        "blockchain_tx": blockchain_tx,  # ✅ stored tx hash
        "created_at": now,
    }
    get_collection("certificates").document(cert_id).set(doc)
    return doc


@router.get("/certificates", response_model=List[CertificateOut])
def list_issued(
    request: Request,
    _: dict = Depends(require_roles(Role.UNIVERSITY)),
    user: dict = Depends(get_current_user),
):
    """List all certificates issued by this university (ensures absolute URLs)"""
    inst_id = user.get("institution_id")
    if not inst_id:
        raise HTTPException(status_code=400, detail="Issuer has no institution_id")

    docs = (
        get_collection("certificates")
        .where("institution_id", "==", inst_id)
        .stream()
    )
    items = []
    for d in docs:
        cert = d.to_dict()
        cert.setdefault("certificate_name", "Unnamed Certificate")
        if cert.get("image_url"):
            cert["image_url"] = _make_absolute_url(request, cert["image_url"])
        if cert.get("pdf_url"):
            cert["pdf_url"] = _make_absolute_url(request, cert["pdf_url"])
        items.append(cert)

    items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return items[:200]


# --------- Student Routes ---------
@router.get("/students", response_model=List[StudentOut])
def list_students(
    _: dict = Depends(require_roles(Role.UNIVERSITY)),
    user: dict = Depends(get_current_user),
):
    inst_id = user.get("institution_id")
    if not inst_id:
        raise HTTPException(status_code=400, detail="Issuer has no institution_id")

    docs = get_collection("students").where("institution_id", "==", inst_id).stream()
    return [d.to_dict() for d in docs]


@router.get("/students/{reg_number}", response_model=StudentOut)
def get_student_by_reg(
    reg_number: str,
    _: dict = Depends(require_roles(Role.UNIVERSITY)),
    user: dict = Depends(get_current_user),
):
    inst_id = user.get("institution_id")
    if not inst_id:
        raise HTTPException(status_code=400, detail="Issuer has no institution_id")

    q = (
        get_collection("students")
        .where("reg_number", "==", reg_number)
        .where("institution_id", "==", inst_id)
        .limit(1)
        .stream()
    )
    docs = list(q)
    if not docs:
        raise HTTPException(status_code=404, detail="Student not found")

    return docs[0].to_dict()


@router.post("/students", response_model=StudentOut)
def add_student(
    req: StudentCreate,
    _: dict = Depends(require_roles(Role.UNIVERSITY)),
    user: dict = Depends(get_current_user),
):
    """Add student and provision login credentials"""
    inst_id = user.get("institution_id")
    if not inst_id:
        raise HTTPException(status_code=400, detail="Issuer has no institution_id")

    users = get_collection("users")
    existing = users.where("email", "==", req.email).limit(1).stream()
    if list(existing):
        raise HTTPException(status_code=400, detail="Email already exists")

    student_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    student_doc = {
        "id": student_id,
        "reg_number": req.reg_number,
        "name": req.name,
        "program": req.program,
        "email": req.email,
        "institution_id": inst_id,
        "created_at": now,
        "is_active": True,
    }
    get_collection("students").document(student_id).set(student_doc)

    user_doc = {
        "id": student_id,
        "email": req.email,
        "password_hash": hash_user_password(req.password),
        "role": Role.STUDENT.value,
        "institution_id": inst_id,
        "is_active": True,
        "created_at": now,
    }
    users.document(student_id).set(user_doc)

    return student_doc


@router.post("/students/{student_id}/deactivate")
def deactivate_student(
    student_id: str,
    _: dict = Depends(require_roles(Role.UNIVERSITY)),
    user: dict = Depends(get_current_user),
):
    """Deactivate a student account + login"""
    inst_id = user.get("institution_id")
    students = get_collection("students")
    users = get_collection("users")

    student_ref = students.document(student_id).get()
    if not student_ref.exists:
        raise HTTPException(404, "Student not found")

    student_data = student_ref.to_dict()
    if student_data.get("institution_id") != inst_id:
        raise HTTPException(403, "Forbidden: Student not in your institution")

    students.document(student_id).update({"is_active": False})
    if users.document(student_id).get().exists:
        users.document(student_id).update({"is_active": False})
    return {"id": student_id, "is_active": False}


@router.post("/students/{student_id}/activate")
def activate_student(
    student_id: str,
    _: dict = Depends(require_roles(Role.UNIVERSITY)),
    user: dict = Depends(get_current_user),
):
    """Activate a student account + login"""
    inst_id = user.get("institution_id")
    students = get_collection("students")
    users = get_collection("users")

    student_ref = students.document(student_id).get()
    if not student_ref.exists:
        raise HTTPException(404, "Student not found")

    student_data = student_ref.to_dict()
    if student_data.get("institution_id") != inst_id:
        raise HTTPException(403, "Forbidden: Student not in your institution")

    students.document(student_id).update({"is_active": True})
    if users.document(student_id).get().exists:
        users.document(student_id).update({"is_active": True})
    return {"id": student_id, "is_active": True}
