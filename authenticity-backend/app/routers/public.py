# app/routers/public.py
from __future__ import annotations

import io
import re
import hashlib
from fastapi import APIRouter, UploadFile, File, HTTPException
from google.cloud import vision
from PyPDF2 import PdfReader

from app.db import get_collection

router = APIRouter(prefix="/verify", tags=["Public"])


# ---------------- Verify by ID ----------------
@router.get("/{certificate_id}")
def verify_by_id(certificate_id: str):
    """
    Public verification by certificate ID.
    Rule: certificate.sha256_hash must equal institution_id OR ocr_hash must exist.
    """
    snap = get_collection("certificates").document(certificate_id).get()
    if not snap.exists:
        return {"status": "NOT FOUND", "certificate_id": certificate_id}

    return _verify_certificate_doc(snap.to_dict(), certificate_id)


# ---------------- Verify by Upload ----------------
@router.post("/upload")
async def verify_certificate(file: UploadFile = File(...)):
    """
    Public verification:
      - Extract certificate UUID from uploaded file (PDF/image)
      - Lookup in Firestore
      - If no UUID found → OCR hash matching
      - If still no match → fuzzy search by OCR’d student name/program
    """
    text = ""
    cert_id = None
    ocr_hash = None

    try:
        data = await file.read()

        # --------- Case 1: PDF file ---------
        if file.filename.lower().endswith(".pdf"):
            reader = PdfReader(io.BytesIO(data))
            for page in reader.pages:
                text += page.extract_text() or ""
            cert_id = _find_cert_id_in_text(text)

            # Build OCR hash from PDF text
            normalized = " ".join(text.strip().lower().split())
            ocr_hash = (
                hashlib.sha256(normalized.encode("utf-8")).hexdigest()
                if normalized
                else None
            )

        # --------- Case 2: Image file ---------
        else:
            client = vision.ImageAnnotatorClient()
            image = vision.Image(content=data)
            response = client.text_detection(image=image)
            if response.error.message:
                raise HTTPException(
                    status_code=500,
                    detail=f"Vision API error: {response.error.message}",
                )
            texts = response.text_annotations
            text = texts[0].description if texts else ""
            cert_id = _find_cert_id_in_text(text)

            normalized = " ".join(text.strip().lower().split())
            ocr_hash = (
                hashlib.sha256(normalized.encode("utf-8")).hexdigest()
                if normalized
                else None
            )

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text: {e}")

    # --------- CASE 1: Found certificate_id ---------
    if cert_id:
        snap = get_collection("certificates").document(cert_id).get()
        if not snap.exists:
            return {"status": "NOT FOUND", "certificate_id": cert_id}
        return _verify_certificate_doc(snap.to_dict(), cert_id)

    # --------- CASE 2: OCR Hash Match ---------
    if text and ocr_hash:
        certs = get_collection("certificates").stream()
        for doc in certs:
            cert = doc.to_dict()
            if cert.get("ocr_hash") == ocr_hash:
                return _verify_certificate_doc(cert, cert.get("id"))

    # --------- CASE 3: Fuzzy matching by student/program ---------
    if text:
        candidates = []
        certs = get_collection("certificates").stream()
        for doc in certs:
            cert = doc.to_dict()
            payload = cert.get("payload", {})
            student_name = str(payload.get("student_name", "")).lower()
            program = str(payload.get("program", "")).lower()

            if student_name and student_name in text.lower():
                candidates.append(cert)
            elif program and program in text.lower():
                candidates.append(cert)

        if not candidates:
            return {
                "status": "NOT FOUND",
                "reason": "No certificate matched by ID, OCR hash, or OCR text",
            }

        # Take the most recent candidate
        candidates.sort(key=lambda c: c.get("created_at", ""), reverse=True)
        best = candidates[0]
        return _verify_certificate_doc(best, best.get("id"))

    raise HTTPException(status_code=400, detail="No text found in uploaded file")


# ---------------- Helpers ----------------
def _find_cert_id_in_text(text: str) -> str | None:
    """Find a UUID-like certificate ID inside OCR/PDF text"""
    if not text:
        return None
    pattern = re.compile(
        r"\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b",
        re.IGNORECASE,
    )
    match = pattern.search(text)
    return match.group(0) if match else None


def _verify_certificate_doc(cert: dict, cert_id: str):
    """Apply verification rules to a certificate record"""
    inst_id = cert.get("institution_id")

    inst_snap = get_collection("institutions").document(inst_id).get()
    if not inst_snap.exists:
        return {
            "status": "INVALID",
            "certificate_id": cert_id,
            "reason": "Institution missing",
        }
    inst = inst_snap.to_dict()

    if cert.get("sha256_hash") == inst_id or cert.get("ocr_hash"):
        payload = cert.get("payload", {}) or {}
        return {
            "status": "VERIFIED",
            "certificate_id": cert_id,
            "institution": inst.get("name"),
            "student_id": cert.get("student_id"),
            "student_name": payload.get("student_name"),
            "issued_at": cert.get("created_at"),
            "certificate_name": cert.get("certificate_name"),
            "blockchain_tx": cert.get("blockchain_tx"),  # ✅ include blockchain tx
        }

    return {
        "status": "INVALID",
        "certificate_id": cert_id,
        "reason": "Institution mismatch",
    }
