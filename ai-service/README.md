# AI Service

FastAPI scaffold for face detection and recognition.

Python is currently a local prerequisite. After Python is installed and available in the shell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Health check:

```powershell
Invoke-WebRequest http://localhost:8000/health
```

Recognition status:

```powershell
Invoke-WebRequest http://localhost:8000/recognition/status
```

Face detection and recognition accept base64 image payloads. Runtime model execution requires OpenCV, InsightFace, ONNX Runtime, and NumPy from `requirements.txt`.
