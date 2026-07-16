# Face Recognition Attendance System

Enterprise-style face recognition attendance management system for the IOCL AOD Information Systems internship project.

The system is organized as a monorepo with a React frontend, Node.js backend, MongoDB database, and Python FastAPI AI service for face detection and recognition.

## Services

- `frontend/`: Vite React app with React Router, Tailwind CSS, shadcn/ui configuration, Axios, and Socket.IO client helpers.
- `backend/`: Express API with MVC-style folders, MongoDB connection config, JWT authentication, employee APIs, camera APIs, attendance marking, recognition proxy routes, and Socket.IO bootstrap.
- `ai-service/`: FastAPI service with health, webcam status, face detection, and recognition endpoints.

## Prerequisites

- Node.js and npm
- Local MongoDB on `mongodb://127.0.0.1:27017/face_attendance`
- Python for the AI service. If `python --version` is not callable in the shell, install or fix Python before running the AI service.

## Environment Setup

Copy each example file before running services:

```powershell
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env
Copy-Item ai-service\.env.example ai-service\.env
```

Default ports:

- Frontend: `5173`
- Backend: `5000`
- AI service: `8000`

## Run Frontend

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173`.

## Run Backend

```powershell
cd backend
npm.cmd install
npm.cmd run dev
```

Health check:

```powershell
Invoke-WebRequest http://localhost:5000/health
```

MongoDB can be offline during local scaffolding checks. The backend starts and reports the database state in `/health`.

## Run AI Service

After Python is installed and available:

```powershell
cd ai-service
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

## Public Interfaces

Backend:

- `GET /health`
- `GET /database/schema`
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET /employees`
- `POST /employees`
- `GET /employees/:id`
- `PATCH /employees/:id`
- `DELETE /employees/:id`
- `POST /employees/:id/face-registration`
- `GET /recognition/status`
- `POST /recognition/detect`
- `POST /recognition/recognize`
- `GET /attendance`
- `GET /attendance/summary`
- `POST /attendance/mark`
- `POST /attendance/manual-mark`
- `GET /cameras`
- `POST /cameras`
- `GET /cameras/:id`
- `PATCH /cameras/:id`
- `PATCH /cameras/:id/status`
- `DELETE /cameras/:id`
- Env: `PORT`, `MONGO_URI`, `CLIENT_URL`, `JWT_SECRET`, `AI_SERVICE_URL`

AI service:

- `GET /health`
- `GET /vision/webcam`
- `GET /vision/face-detection`
- `GET /recognition/status`
- `POST /recognition/detect`
- `POST /recognition/recognize`
- Env: `PORT`, `BACKEND_URL`, `CAMERA_INDEX`

Frontend:

- Env: `VITE_API_URL`, `VITE_SOCKET_URL`

## Data Models

MongoDB collections:

- `Employee`: basic employee information, face embedding, registered images, and attendance references
- `Attendance`: employee reference, date, punch-in, punch-out, working minutes, status, confidence, and camera reference
- `Camera`: camera name, location, source, status, and last-seen tracking
- `Admin`: admin identity, password hash, role, status, and last-login tracking

Schema metadata:

```powershell
Invoke-WebRequest http://localhost:5000/database/schema
```

## Authentication

Admin authentication includes:

- Registration with bcrypt password hashing
- Login with JWT issue
- Protected session validation through `GET /auth/me`
- Stateless logout response through `POST /auth/logout`
- Bearer-token middleware for protected backend routes
- Frontend login, registration, and protected-session screens

Example login:

```powershell
Invoke-WebRequest http://localhost:5000/auth/login `
  -Method POST `
  -ContentType "application/json" `
  -Body '{"email":"admin@example.com","password":"password123"}'
```

Protected backend routes require:

```text
Authorization: Bearer <jwt-token>
```

## Employee Management

Employee management includes:

- Create employee
- Edit employee
- Delete employee
- Search and filter employees
- Employee detail endpoint
- Face-registration placeholder endpoint for image references and future embedding data
- Frontend employee registration and listing screen

## Face Recognition

AI recognition support includes:

- OpenCV webcam status check
- InsightFace dependency status check
- Base64 image face detection endpoint
- Base64 image recognition endpoint using cosine similarity against known embeddings
- Unknown-face handling when confidence is below threshold
- Backend protected proxy routes for recognition status, detection, and recognition
- Backend recognition using active employees with stored face embeddings as known faces

Runtime note: model execution requires Python, OpenCV, InsightFace, ONNX Runtime, NumPy, and a valid image or camera source. The endpoints return dependency errors when the AI runtime is not installed.

## Attendance

Attendance support includes:

- Recognition-driven attendance marking through `POST /attendance/mark`
- Manual test marking through `POST /attendance/manual-mark`
- Automatic punch-in when no attendance exists for the employee today
- Automatic punch-out when punch-in exists and punch-out is missing
- Duplicate recognition prevention using `ATTENDANCE_PUNCH_OUT_COOLDOWN_MINUTES`
- Working minutes calculation on punch-out
- Daily summary counts for total, present, absent, completed, and pending punch-out
- Real-time `attendance:marked` Socket.IO event after punch-in or punch-out
- Frontend attendance summary, log view, and manual test mark screen

Attendance routes require:

```text
Authorization: Bearer <jwt-token>
```

## Camera Management

Camera management includes:

- Register camera name, location, source, and type
- Search and list cameras
- Update camera metadata
- Set camera status to online, offline, or disabled
- Track last-seen timestamp when cameras are marked online
- Emit `camera:connected` and `camera:disconnected` Socket.IO events
- Frontend camera management screen

Camera routes require:

```text
Authorization: Bearer <jwt-token>
```

## Remaining Work

- Real webcam capture flow in the frontend
- Dashboard workflows
- Reports and exports
