import mongoose from 'mongoose'

const defaultMongoUri = 'mongodb://127.0.0.1:27017/face_attendance'

export async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI || defaultMongoUri

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
    })
    console.log('MongoDB connected')
  } catch (error) {
    console.warn(`MongoDB unavailable: ${error.message}`)
  }
}

export function getDatabaseStatus() {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }

  return {
    state: states[mongoose.connection.readyState] || 'unknown',
    host: mongoose.connection.host || null,
    name: mongoose.connection.name || null,
  }
}
