import uuid
import base64
import json
from app.db import get_collection
from app.services.certificate_service import CertificateService

def test_issue_certificate(monkeypatch):
    inst_id = str(uuid.uuid4())
    student_id = str(uuid.uuid4())

    # Insert fake approved institution
    insts = get_collection("institutions")
    insts.document(inst_id).set({
        "id": inst_id,
        "name": "Test University",
        "status": "APPROVED",
        "public_key_pem": "-----BEGIN PUBLIC KEY-----\n...\n-----END PUBLIC KEY-----",
    })

    payload = {"student_name": "Alice", "program": "B.Tech", "issue_date": "2025-09-18"}
    fake_sig = base64.b64encode(b"fakesig").decode("utf-8")

    def fake_verify(data, sig, pub): return True
    monkeypatch.setattr("app.services.certificate_service.verify_detached_signature", fake_verify)
    monkeypatch.setattr("app.services.certificate_service.load_public_key_from_pem", lambda pem: object())

    cert = CertificateService.issue_certificate(inst_id, student_id, payload, fake_sig)
    assert cert["institution_id"] == inst_id
    assert cert["student_id"] == student_id
    assert cert["status"] == "ISSUED"
    assert cert["sha256_hash"]
