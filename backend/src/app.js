import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import healthRoutes from './routes/health.routes.js'

dotenv.config()

const app = express()

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
)
app.use(express.json())

app.use('/health', healthRoutes)

app.use((req, res) => {
  res.status(404).json({
    status: 'not_found',
    message: `No route found for ${req.method} ${req.originalUrl}`,
  })
})

export default app
