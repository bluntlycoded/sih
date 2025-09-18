# Authenticity Validator Backend

A **FastAPI + Firebase** backend for verifying academic certificates with:
- Digital signatures
- Blockchain anchoring
- Firestore persistence
- Role-based access control (Admin, University, Student, Public)

---

## 🚀 Features
- JWT Authentication (Access + Refresh tokens)
- Admin: approve/revoke universities, manage keys
- University: issue signed certificates
- Student: view & share verified certificates
- Public: verify certificates via upload or ID
- Firebase Firestore as the main database
- Optional Firestore Emulator for local development
- PDF generation with embedded QR codes
- OCR + QR-based certificate verification
- Dockerized for easy deployment

---

