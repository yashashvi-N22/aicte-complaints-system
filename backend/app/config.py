import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "AICTE Integrated Institution Complaint Monitoring System"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    API_V1_PREFIX: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "aicte_super_secret_jwt_key_gov_portal_2026_x98z")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database URL: PostgreSQL default with fallback to local SQLite for rapid dev testing
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:///./aicte_portal.db"
    )
    
    # CORS Origins
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]
    
    # Duplicate detection threshold (0.0 to 1.0)
    DUPLICATE_SIMILARITY_THRESHOLD: float = 0.40

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
