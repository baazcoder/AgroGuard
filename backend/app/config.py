import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    PROJECT_NAME: str = "AgroGuard Backend"
    VERSION: str = "1.0.0"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "*"
    ]

settings = Settings()
