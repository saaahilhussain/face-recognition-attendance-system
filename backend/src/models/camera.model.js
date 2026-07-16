import mongoose from 'mongoose'

const cameraSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    source: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['webcam', 'ip_camera', 'iriun', 'other'],
      default: 'webcam',
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'disabled'],
      default: 'offline',
      index: true,
    },
    lastSeenAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
)

cameraSchema.index({ location: 1, status: 1 })

export const Camera = mongoose.model('Camera', cameraSchema)
