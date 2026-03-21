from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Secure Cloud Drive API"
    API_V1_STR: str = "/api/v1"
    
    # DATABASE
    POSTGRES_SERVER: str = "vps-address" # REPLACE WITH VPS IP
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "password"
    POSTGRES_DB: str = "driveapp"
    SQLALCHEMY_DATABASE_URI: str | None = None

    # SECURITY
    SECRET_KEY: str = "CHANGE_ME_IN_PRODUCTION"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    FILE_ENCRYPTION_KEY: bytes = b'oH2jF_bQ4yL4sF_qI1kY1aH2wE6oF2eN9aY2gH0qF3I=' # MUST BE EXACTLY 32 URL-safe base64-encoded bytes (Fernet key)
    RECAPTCHA_SECRET_KEY: str = "6LeIxAcTAAAAANRCFa25pLXC2uIm94F2e_2E1i3o" # Test key that always passes

    model_config = {
        "case_sensitive": True,
        "env_file": ".env"
    }

settings = Settings()
