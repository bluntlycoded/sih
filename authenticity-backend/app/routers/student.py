# app/routers/student.py
from __future__ import annotations

import os
from fastapi import APIRouter, Depends, HTTPException, Request
from typing import List

from app.core.roles import Role
from app.deps import require_roles, get_current_user
from app.db import get_collection

router = APIRouter(prefix="/student", tags=["Student"])

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8000")


def _make_absolute_url(path: str, request: Request) -> str:
    """
    Ensure image_url/pdf_url are absolute URLs.
    Prefer APP_BASE_URL (from .env), fall back to request.base_url.
    """
    base_url = APP_BASE_URL or str(request.base_url).rstrip("/")
    if not path:
        return None
    if path.startswith("http://") or path.startswith("https://"):
        return path
    if not path.startswith("/"):
        path = "/" + path
    return f"{base_url}{path}"


@router.get("/certificates")
def list_student_certificates(
    request: Request,
    _: dict = Depends(require_roles(Role.STUDENT)),
    user: dict = Depends(get_current_user),
):
    """
    List all certificates for the logged-in student with:
      - institution_name
      - verification_status (VERIFIED/INVALID)
      - share_url (/verify/<cert_id>) for public sharing
      - certificate_name (set by university when issuing)
      - image_url (absolute URL so frontend can render images)
    """
    student_id = user.get("id")
    if not student_id:
        raise HTTPException(status_code=400, detail="Student id missing")

    docs = (
        get_collection("certificates")
        .where("student_id", "==", student_id)
        .stream()
    )
    certs = [d.to_dict() for d in docs]

    results: List[dict] = []
    for c in certs:
        inst_id = c.get("institution_id")
        inst_snap = get_collection("institutions").document(inst_id).get()
        inst = inst_snap.to_dict() if inst_snap.exists else None

        # verification logic
        if not inst:
            status = "INVALID"
            reason = "Institution missing"
        elif c.get("sha256_hash") == inst_id:  # jugaad check
            status = "VERIFIED"
            reason = None
        else:
            status = "INVALID"
            reason = "Institution mismatch"

        results.append(
            {
                **c,
                "institution_name": inst.get("name") if inst else None,
                "verification_status": status,
                "reason": reason,
                "share_url": f"{APP_BASE_URL}/verify/{c['id']}",
                "certificate_name": c.get("certificate_name"),
                "image_url": _make_absolute_url(c.get("image_url"), request),
                "pdf_url": _make_absolute_url(c.get("pdf_url"), request)
                if c.get("pdf_url")
                else None,
            }
        )

    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results
