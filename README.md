# Face Recognition Attendance System

Enterprise-style face recognition attendance management system for the IOCL AOD Information Systems internship project.

This repository is currently through Phase 4: monorepo scaffolding, environment examples, health checks, REST/WebSocket wiring, starter AI-service structure, MongoDB schema design, admin authentication, and employee management APIs.

## Services

- `frontend/`: Vite React app with React Router, Tailwind CSS, shadcn/ui configuration, Axios, and Socket.IO client helpers.
- `backend/`: Express API with MVC-style folders, MongoDB connection config, health endpoint, and Socket.IO server bootstrap.
- `ai-service/`: FastAPI scaffold with health, webcam-status, and face-detection placeholder endpoints.

## Prerequisites

- Node.js and npm
- Local MongoDB on `mongodb://127.0.0.1:27017/face_attendance`
- Python for the AI service. If `python --version` is not callable in the shell, install/fix Python before running the AI service.

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

MongoDB is allowed to be offline during Phase 1. The backend starts and reports the database state in `/health`.

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
- Env: `PORT`, `MONGO_URI`, `CLIENT_URL`, `JWT_SECRET`, `AI_SERVICE_URL`

AI service:

- `GET /health`
- `GET /vision/webcam`
- `GET /vision/face-detection`
- Env: `PORT`, `BACKEND_URL`, `CAMERA_INDEX`

Frontend:

- Env: `VITE_API_URL`, `VITE_SOCKET_URL`

## Phase 1 Scope

Implemented:

- Project scaffolds and service folder structure
- Backend health endpoint and Socket.IO initialization
- Frontend routing shell and API/socket helpers
- AI FastAPI placeholder structure
- Environment examples and development instructions

Not implemented yet:

- Attendance logic
- Real webcam capture and face recognition runtime verification
- Dashboard workflows

## Phase 2 Scope

Implemented MongoDB collections:

- `Employee`: basic employee information, face embedding, registered images, and attendance references
- `Attendance`: employee reference, date, punch-in, punch-out, working minutes, status, confidence, and camera reference
- `Camera`: camera name, location, source, status, and last-seen tracking
- `Admin`: admin identity, password hash, role, status, and last-login tracking

Schema metadata is available at:

```powershell
Invoke-WebRequest http://localhost:5000/database/schema
```

## Phase 3 Scope

Implemented admin authentication:

- Admin registration with bcrypt password hashing
- Admin login with JWT issue
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

## Phase 4 Scope

Implemented employee management:

- Create employee
- Edit employee
- Delete employee
- Search and filter employees
- Employee detail endpoint
- Placeholder face-registration endpoint for front, left, right, and other image references plus future embedding data
- Frontend employee registration and listing screen

Employee routes require:

```text
Authorization: Bearer <jwt-token>
```
