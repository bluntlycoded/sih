import uuid
from app.core.password import hash_password
from app.db import get_collection

def test_register_admin_and_login(client, monkeypatch):
    email = f"admin-{uuid.uuid4()}@example.com"
    password = "StrongPass#1"

    # Ensure no user exists
    users = get_collection("users")
    for doc in users.where("email", "==", email).stream():
        users.document(doc.id).delete()

    resp = client.post("/auth/register-admin", json={
        "email": email,
        "password": password,
        "bootstrap_secret": "change-me-bootstrap-secret"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["email"] == email
    assert data["role"] == "ADMIN"

    resp2 = client.post("/auth/login", json={"email": email, "password": password})
    assert resp2.status_code == 200
    tokens = resp2.json()
    assert "access_token" in tokens
    assert "refresh_token" in tokens

    resp3 = client.post("/auth/refresh", json={"refresh_token": tokens["refresh_token"]})
    assert resp3.status_code == 200
    assert "access_token" in resp3.json()
