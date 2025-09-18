from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, users, admin, university, student, public
from app.utils.logger import configure_logging

# Configure logging early
configure_logging(level="INFO", as_json=True)

app = FastAPI(
    title="Authenticity Validator Backend",
    version="1.0.0",
    description="API backend for certificate authenticity verification with digital signatures and public verification.",
)

# CORS
origins = settings.CORS_ORIGINS or ["http://localhost:5173", "http://127.0.0.1:5173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # keep False when using Authorization header tokens
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
)

# Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(admin.router)
app.include_router(university.router)
app.include_router(student.router)
app.include_router(public.router)

# Health check
@app.get("/healthz")
async def health_check():
    return {"status": "ok", "env": settings.APP_ENV, "name": settings.APP_NAME}
