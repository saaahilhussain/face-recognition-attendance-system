# AI Service

FastAPI scaffold for face detection and recognition.

Python is currently a local prerequisite. After Python is installed and available in the shell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

If you are using bash or Git Bash on Windows, activate the environment with:

```bash
source .venv/Scripts/activate
```

If you want to skip activation, run the service with the venv Python directly:

```bash
./.venv/Scripts/python.exe -m uvicorn app.main:app --reload --port 8000
```

Health check:

```powershell
Invoke-WebRequest http://localhost:8000/health
```

Recognition status:

```powershell
Invoke-WebRequest http://localhost:8000/recognition/status
```

Face detection and recognition accept base64 image payloads. The default install includes OpenCV, InsightFace, ONNX Runtime, and NumPy for the recognition endpoints.
