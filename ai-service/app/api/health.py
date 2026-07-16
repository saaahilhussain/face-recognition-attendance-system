from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import settings

router = APIRouter()


@router.get("/health")
def health_check():
    return {
        "service": "ai-service",
        "status": "ok",
        "camera_index": settings.camera_index,
        "backend_url": settings.backend_url,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
