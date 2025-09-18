import uuid, hashlib, base64, json
from datetime import datetime, timezone
from fastapi import HTTPException, status
from app.db import get_collection
from app.utils.crypto import load_public_key_from_pem, verify_detached_signature

class CertificateService:
    @staticmethod
    def _canonical_bytes(obj: dict) -> bytes:
        return json.dumps(obj, separators=(",", ":"), sort_keys=True).encode("utf-8")

    @staticmethod
    def issue_certificate(institution_id: str, student_id: str, payload: dict, signature_b64: str):
        inst_ref = get_collection("institutions").document(institution_id)
        inst = inst_ref.get().to_dict() if inst_ref.get().exists else None
        if not inst or inst["status"] != "APPROVED":
            raise HTTPException(status_code=403, detail="Institution not approved")

        pub_pem = inst.get("public_key_pem")
        if not pub_pem:
            raise HTTPException(status_code=400, detail="Institution public key not set")

        try:
            pub = load_public_key_from_pem(pub_pem)
            sig = base64.b64decode(signature_b64)
            data = CertificateService._canonical_bytes(payload)
            if not verify_detached_signature(data, sig, pub):
                raise HTTPException(status_code=400, detail="Digital signature verification failed")
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Signature processing error: {e}")

        content_hash = hashlib.sha256(CertificateService._canonical_bytes(payload)).hexdigest()

        cert_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        doc = {
            "id": cert_id,
            "institution_id": institution_id,
            "student_id": student_id,
            "sha256_hash": content_hash,
            "signature": signature_b64,
            "pdf_url": None,
            "blockchain_tx": None,
            "status": "ISSUED",
            "created_at": now,
        }
        get_collection("certificates").document(cert_id).set(doc)
        return doc

    @staticmethod
    def list_certificates_by_institution(institution_id: str):
        docs = get_collection("certificates").where("institution_id", "==", institution_id).stream()
        items = [d.to_dict() for d in docs]
        return sorted(items, key=lambda x: x.get("created_at",""), reverse=True)

    @staticmethod
    def list_certificates_by_student(student_id: str):
        docs = get_collection("certificates").where("student_id", "==", student_id).stream()
        items = [d.to_dict() for d in docs]
        return sorted(items, key=lambda x: x.get("created_at",""), reverse=True)
