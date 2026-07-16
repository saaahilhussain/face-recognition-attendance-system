# Manual Testing Checklist

## 1. Start MongoDB Locally

Make sure MongoDB is running at:

```text
mongodb://127.0.0.1:27017/face_attendance
```

## 2. Install Dependencies

```powershell
cd backend
npm.cmd install

cd ..\frontend
npm.cmd install
```

## 3. Check Environment Files

Make sure these files exist:

```text
backend/.env
frontend/.env
ai-service/.env
```

Backend `.env` should include:

```env
JWT_SECRET=replace-with-a-development-secret
MONGO_URI=mongodb://127.0.0.1:27017/face_attendance
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:8000
```

## 4. Run Backend

```powershell
cd backend
npm.cmd run dev
```

Check backend health:

```powershell
Invoke-WebRequest http://localhost:5000/health
```

If MongoDB is running, the database state should show `connected`.

## 5. Run Frontend

Open another terminal:

```powershell
cd frontend
npm.cmd run dev
```

Open:

```text
http://localhost:5173
```

## 6. Create First Admin

Use the frontend register page first:

```text
/register
```

Then log in:

```text
/login
```

## 7. Manual Test Order

Test in this order:

1. Open `/` and confirm public landing page links are visible
2. Register a public employee from `/employee-register`
3. Mark public attendance from `/mark-attendance` using the new employee ID
4. Register/Login Admin from `/admin-register` and `/login`
5. Confirm `/dashboard`, `/employees`, `/attendance`, `/cameras`, `/reports`, `/session`, and `/health` redirect to `/login` when logged out
6. Create Employee from the admin console
7. Create Camera
8. Set Camera Online
9. Manual Attendance Mark using Employee ID
10. Check Dashboard
11. Check Attendance logs/history/monthly report
12. Download Reports
13. Check live activity events

## 8. AI Service Note

Skip real face recognition until Python works.

Manual attendance and most app features can be tested without the AI service running.

For AI testing later:

```powershell
cd ai-service
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then check:

```powershell
Invoke-WebRequest http://localhost:8000/recognition/status
```
