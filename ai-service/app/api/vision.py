from fastapi import APIRouter

from app.services.face_detection import verify_face_detection_ready
from app.services.webcam import get_webcam_status

router = APIRouter()


@router.get("/webcam")
def webcam_status():
    return get_webcam_status()


@router.get("/face-detection")
def face_detection_status():
    return verify_face_detection_ready()
