from __future__ import annotations

import os
from fastapi import APIRouter, Depends, HTTPException
from typing import List

from app.core.roles import Role
from app.deps import require_roles, get_current_user
from app.db import get_collection

router = APIRouter(prefix="/student", tags=["Student"])

APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:8000")


@router.get("/certificates")
def list_student_certificates(
    _: dict = Depends(require_roles(Role.STUDENT)),
    user: dict = Depends(get_current_user),
):
    """
    List all certificates for the logged-in student with:
      - institution_name
      - verification_status (VERIFIED/INVALID)
      - share_url (/verify/<cert_id>) for public sharing
    """
    student_id = user.get("id")
    if not student_id:
        raise HTTPException(status_code=400, detail="Student id missing")

    docs = get_collection("certificates").where("student_id", "==", student_id).stream()
    certs = [d.to_dict() for d in docs]

    results = []
    for c in certs:
        inst_id = c.get("institution_id")
        inst_snap = get_collection("institutions").document(inst_id).get()
        inst = inst_snap.to_dict() if inst_snap.exists else None

        if not inst:
            status = "INVALID"
            reason = "Institution missing"
        elif c.get("sha256_hash") == inst_id:  # jugaad rule: hash == institution_id
            status = "VERIFIED"
            reason = None
        else:
            status = "INVALID"
            reason = "Institution mismatch"

        results.append({
            **c,
            "institution_name": inst.get("name") if inst else None,
            "verification_status": status,
            "reason": reason,
            "share_url": f"{APP_BASE_URL}/verify/{c['id']}",
        })

    results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    return results
