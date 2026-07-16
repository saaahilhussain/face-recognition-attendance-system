import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import attendanceRoutes from './routes/attendance.routes.js'
import authRoutes from './routes/auth.routes.js'
import cameraRoutes from './routes/camera.routes.js'
import dashboardRoutes from './routes/dashboard.routes.js'
import databaseRoutes from './routes/database.routes.js'
import employeeRoutes from './routes/employee.routes.js'
import healthRoutes from './routes/health.routes.js'
import recognitionRoutes from './routes/recognition.routes.js'

dotenv.config()

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/health', healthRoutes)
app.use('/database', databaseRoutes)
app.use('/employees', employeeRoutes)
app.use('/recognition', recognitionRoutes)
app.use('/attendance', attendanceRoutes)
app.use('/cameras', cameraRoutes)
app.use('/dashboard', dashboardRoutes)

app.use((req, res) => {
  res.status(404).json({
    status: 'not_found',
    message: `No route found for ${req.method} ${req.originalUrl}`,
  })
})

export default app
