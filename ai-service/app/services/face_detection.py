def verify_face_detection_ready():
    try:
        from app.services.recognition import get_recognition_status

        return get_recognition_status()
    except Exception as error:
        return {
            "status": "not_ready",
            "model": "InsightFace buffalo_l",
            "message": str(error),
        }
