from app.core.config import settings


def get_webcam_status():
    return {
        "status": "not_verified",
        "camera_index": settings.camera_index,
        "message": "Webcam runtime verification is pending until Python dependencies are installed.",
    }
