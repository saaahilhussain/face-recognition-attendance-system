const fallbackOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173']

const configuredOrigins = (process.env.CLIENT_URLS || process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const allowedOrigins = new Set(
  configuredOrigins.length > 0 ? configuredOrigins : fallbackOrigins,
)

export function validateOrigin(origin, callback) {
  if (!origin || allowedOrigins.has(origin)) {
    callback(null, true)
    return
  }

  callback(new Error(`Origin not allowed by CORS: ${origin}`))
}

export const corsOptions = {
  origin: validateOrigin,
  credentials: true,
}
