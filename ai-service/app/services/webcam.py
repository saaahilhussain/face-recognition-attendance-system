from app.core.config import settings


def get_webcam_status():
    try:
        import cv2  # type: ignore
    except ImportError:
        return {
            "status": "dependencies_missing",
            "camera_index": settings.camera_index,
            "message": "OpenCV is required for webcam verification.",
        }

    capture = cv2.VideoCapture(settings.camera_index)
    opened = capture.isOpened()
    capture.release()

    return {
        "status": "available" if opened else "unavailable",
        "camera_index": settings.camera_index,
        "message": "Camera opened successfully." if opened else "Camera could not be opened.",
    }
