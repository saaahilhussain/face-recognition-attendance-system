from fastapi import APIRouter, HTTPException

from app.models.recognition import RecognitionRequest
from app.services.recognition import (
    RecognitionRuntimeError,
    detect_faces_from_base64,
    get_recognition_status,
    recognize_faces,
)

router = APIRouter()


@router.get("/status")
def status():
    return get_recognition_status()


@router.post("/detect")
def detect(payload: RecognitionRequest):
    try:
        detections = detect_faces_from_base64(payload.image_base64)
    except RecognitionRuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error

    return {
        "status": "ok",
        "faces_detected": len(detections),
        "detections": detections,
    }


@router.post("/recognize")
def recognize(payload: RecognitionRequest):
    try:
        return recognize_faces(payload)
    except RecognitionRuntimeError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
