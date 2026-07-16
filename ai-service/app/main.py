from fastapi import FastAPI

from app.api.health import router as health_router
from app.api.vision import router as vision_router

app = FastAPI(
    title="Face Attendance AI Service",
    version="0.1.0",
    description="Phase 1 FastAPI scaffold for webcam and face-recognition services.",
)

app.include_router(health_router)
app.include_router(vision_router, prefix="/vision", tags=["vision"])
