from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.recognition import router as recognition_router
from app.api.vision import router as vision_router

app = FastAPI(
    title="Face Attendance AI Service",
    version="0.1.0",
    description="FastAPI service for webcam, face detection, and recognition.",
)

app.include_router(health_router)
app.include_router(vision_router, prefix="/vision", tags=["vision"])
app.include_router(recognition_router, prefix="/recognition", tags=["recognition"])
