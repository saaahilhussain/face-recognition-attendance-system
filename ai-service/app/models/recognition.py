from pydantic import BaseModel, Field


class KnownFace(BaseModel):
    employee_id: str = Field(..., min_length=1)
    employee_code: str | None = None
    full_name: str | None = None
    embedding: list[float] = Field(..., min_length=1)


class RecognitionRequest(BaseModel):
    image_base64: str = Field(..., min_length=1)
    known_faces: list[KnownFace] = Field(default_factory=list)
    threshold: float = Field(default=0.45, ge=0, le=1)


class FaceBox(BaseModel):
    x: int
    y: int
    width: int
    height: int
    confidence: float


class FacePose(BaseModel):
    yaw: float
    pitch: float
    roll: float
    orientation: str
    guidance: str | None = None


class FaceDetectionResult(BaseModel):
    box: FaceBox
    embedding: list[float] = Field(default_factory=list)
    pose: FacePose | None = None


class RecognitionMatch(BaseModel):
    employee_id: str | None
    employee_code: str | None = None
    full_name: str | None = None
    confidence: float
    status: str


class RecognitionResponse(BaseModel):
    status: str
    faces_detected: int
    detections: list[FaceDetectionResult]
    matches: list[RecognitionMatch]
    message: str | None = None
