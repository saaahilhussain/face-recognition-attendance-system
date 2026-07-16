import os
from dataclasses import dataclass

from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    port: int = int(os.getenv("PORT", "8000"))
    backend_url: str = os.getenv("BACKEND_URL", "http://localhost:5000")
    camera_index: int = int(os.getenv("CAMERA_INDEX", "0"))


settings = Settings()
