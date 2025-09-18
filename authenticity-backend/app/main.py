# app/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.routers import auth, users, admin, university, public, student
from app.utils.logger import configure_logging
from app.deps import get_current_user

# Configure logging early
configure_logging(level="INFO", as_json=True)

app = FastAPI(
    title="Authenticity Validator Backend",
    version="1.0.0",
    description="API backend for certificate authenticity verification with digital signatures and public verification.",
)

# ----------------- CORS -----------------
origins = settings.CORS_ORIGINS or [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # allows cookies if you later need them
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# ----------------- Static Files -----------------
# Serve uploaded certificate images
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# ----------------- Routers -----------------
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(university.router)  # ✅ /issuer/*
app.include_router(student.router)     # ✅ /student/*
app.include_router(public.router)

# ----------------- Health check -----------------
@app.get("/healthz")
async def health_check():
    return {"status": "ok", "env": settings.APP_ENV, "name": settings.APP_NAME}

# ----------------- /me endpoint -----------------
@app.get("/me")
async def get_current_user_me(user: dict = Depends(get_current_user)):
    """Return the current authenticated user (institution_id, role, etc)."""
    if not user:
        return {"error": "Not authenticated"}
    return {
        "id": user.get("id"),
        "email": user.get("email"),
        "role": str(user.get("role")),
        "institution_id": user.get("institution_id"),
        "is_active": user.get("is_active", True),
        "created_at": user.get("created_at"),
    }
