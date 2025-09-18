from __future__ import annotations

from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional

from app.db import get_collection
from app.utils.crypto import extract_certificate_id_from_pdf_or_image

router = APIRouter(prefix="/verify", tags=["Public"])


@router.get("/{certificate_id}")
def verify_by_id(certificate_id: str):
    """
    Public verification by certificate ID.
    Jugaad verification: certificate.sha256_hash must equal institution_id.
    """
    snap = get_collection("certificates").document(certificate_id).get()
    if not snap.exists:
        return {"status": "NOT FOUND", "certificate_id": certificate_id}

    cert = snap.to_dict()
    inst_id = cert.get("institution_id")

    inst_snap = get_collection("institutions").document(inst_id).get()
    if not inst_snap.exists:
        return {"status": "INVALID", "certificate_id": certificate_id, "reason": "Institution missing"}

    # Jugaad check
    if cert.get("sha256_hash") == inst_id:
        inst = inst_snap.to_dict()
        return {
            "status": "VERIFIED",
            "certificate_id": certificate_id,
            "institution": inst.get("name"),
            "student_id": cert.get("student_id"),
            "issued_at": cert.get("created_at"),
        }

    return {"status": "INVALID", "certificate_id": certificate_id, "reason": "Institution mismatch"}

@router.post("/upload")
async def verify_certificate(file: UploadFile = File(...)):
    """
    Public verification:
      - Extract certificate UUID from uploaded file (PDF/image/QR/text)
      - Lookup in Firestore
      - Jugaad verification: check if sha256_hash == institution_id
    """
    try:
        data = await file.read()
        cert_id = extract_certificate_id_from_pdf_or_image(data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract certificate id: {e}")

    snap = get_collection("certificates").document(cert_id).get()
    if not snap.exists:
        return {"status": "NOT FOUND", "certificate_id": cert_id}

    cert = snap.to_dict()
    inst_id = cert.get("institution_id")

    # check institution exists
    inst_snap = get_collection("institutions").document(inst_id).get()
    if not inst_snap.exists:
        return {"status": "INVALID", "certificate_id": cert_id, "reason": "Institution missing"}
    inst = inst_snap.to_dict()

    # Jugaad check: sha256_hash == institution_id
    if cert.get("sha256_hash") == inst_id:
        return {
            "status": "VERIFIED",
            "certificate_id": cert_id,
            "institution": inst.get("name"),
            "student_id": cert.get("student_id"),
            "issued_at": cert.get("created_at"),
        }

    return {"status": "INVALID", "certificate_id": cert_id, "reason": "Institution mismatch"}
