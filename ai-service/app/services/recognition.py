import base64
import binascii
import math
from functools import lru_cache

from app.models.recognition import (
    FaceBox,
    FaceDetectionResult,
    KnownFace,
    RecognitionMatch,
    RecognitionRequest,
    RecognitionResponse,
)


class RecognitionRuntimeError(RuntimeError):
    pass


def _import_cv2():
    try:
        import cv2  # type: ignore
        import numpy as np  # type: ignore
    except ImportError as error:
        raise RecognitionRuntimeError(
            "OpenCV and NumPy are required. Install ai-service requirements first."
        ) from error

    return cv2, np


@lru_cache(maxsize=1)
def _get_face_app():
    try:
        from insightface.app import FaceAnalysis  # type: ignore
    except ImportError as error:
        raise RecognitionRuntimeError(
            "InsightFace is required. Install ai-service requirements first."
        ) from error

    app = FaceAnalysis(name="buffalo_l")
    app.prepare(ctx_id=0, det_size=(640, 640))
    return app


def _decode_image(image_base64: str):
    cv2, np = _import_cv2()
    payload = image_base64.split(",", 1)[-1]

    try:
        image_bytes = base64.b64decode(payload, validate=True)
    except (binascii.Error, ValueError) as error:
        raise RecognitionRuntimeError("Image payload must be valid base64.") from error

    image_array = np.frombuffer(image_bytes, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise RecognitionRuntimeError("Image payload could not be decoded.")

    return image


def _cosine_similarity(left: list[float], right: list[float]) -> float:
    if len(left) != len(right) or not left:
        return 0.0

    dot = sum(a * b for a, b in zip(left, right))
    left_norm = math.sqrt(sum(a * a for a in left))
    right_norm = math.sqrt(sum(b * b for b in right))

    if left_norm == 0 or right_norm == 0:
        return 0.0

    return max(min(dot / (left_norm * right_norm), 1.0), -1.0)


def _to_confidence(similarity: float) -> float:
    return round((similarity + 1) / 2, 4)


def _best_match(embedding: list[float], known_faces: list[KnownFace], threshold: float):
    best_known = None
    best_confidence = 0.0

    for known_face in known_faces:
        confidence = _to_confidence(_cosine_similarity(embedding, known_face.embedding))

        if confidence > best_confidence:
            best_confidence = confidence
            best_known = known_face

    if best_known and best_confidence >= threshold:
        return RecognitionMatch(
            employee_id=best_known.employee_id,
            employee_code=best_known.employee_code,
            full_name=best_known.full_name,
            confidence=best_confidence,
            status="recognized",
        )

    return RecognitionMatch(
        employee_id=None,
        confidence=best_confidence,
        status="unknown",
    )


def detect_faces_from_base64(image_base64: str) -> list[FaceDetectionResult]:
    image = _decode_image(image_base64)
    app = _get_face_app()
    faces = app.get(image)
    detections: list[FaceDetectionResult] = []

    for face in faces:
        x1, y1, x2, y2 = [int(value) for value in face.bbox]
        embedding = [float(value) for value in face.embedding.tolist()]
        detections.append(
            FaceDetectionResult(
                box=FaceBox(
                    x=x1,
                    y=y1,
                    width=max(x2 - x1, 0),
                    height=max(y2 - y1, 0),
                    confidence=float(getattr(face, "det_score", 0)),
                ),
                embedding=embedding,
            )
        )

    return detections


def recognize_faces(payload: RecognitionRequest) -> RecognitionResponse:
    detections = detect_faces_from_base64(payload.image_base64)
    matches = [
        _best_match(detection.embedding, payload.known_faces, payload.threshold)
        for detection in detections
    ]

    return RecognitionResponse(
        status="ok",
        faces_detected=len(detections),
        detections=detections,
        matches=matches,
    )


def get_recognition_status():
    dependencies = {
        "opencv": "missing",
        "numpy": "missing",
        "insightface": "missing",
    }

    try:
        _import_cv2()
        dependencies["opencv"] = "available"
        dependencies["numpy"] = "available"
    except RecognitionRuntimeError:
        pass

    try:
        import insightface  # noqa: F401

        dependencies["insightface"] = "available"
    except ImportError:
        pass

    return {
        "status": (
            "ready"
            if all(value == "available" for value in dependencies.values())
            else "dependencies_missing"
        ),
        "model": "InsightFace buffalo_l",
        "dependencies": dependencies,
    }
