from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App metadata
    APP_NAME: str = "authenticity-backend"
    APP_ENV: str = "dev"
    APP_HOST: str = "0.0.0.0"
    APP_PORT: int = 8000

    # Security
    JWT_SECRET: str
    JWT_ALG: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BOOTSTRAP_ADMIN_SECRET: str

    # Firebase
    FIREBASE_CREDENTIALS: str = "firebase-service-account.json"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    class Config:
        env_file = ".env"


settings = Settings()
