import mongoose from 'mongoose'
import { Camera } from '../models/camera.model.js'
import { emitSocketEvent } from '../socket/emitter.js'

const cameraStatuses = ['online', 'offline', 'disabled']
const cameraTypes = ['webcam', 'ip_camera', 'iriun', 'other']

function assertObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid camera id')
    error.statusCode = 400
    throw error
  }
}

function buildFilter(query) {
  const filter = {}

  if (query.status) {
    filter.status = query.status
  }

  if (query.type) {
    filter.type = query.type
  }

  if (query.location) {
    filter.location = new RegExp(query.location, 'i')
  }

  if (query.search) {
    filter.$or = [
      { name: new RegExp(query.search, 'i') },
      { location: new RegExp(query.search, 'i') },
      { source: new RegExp(query.search, 'i') },
    ]
  }

  return filter
}

export function getCameraOptions() {
  return {
    statuses: cameraStatuses,
    types: cameraTypes,
  }
}

export async function listCameras(query) {
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  const skip = (page - 1) * limit
  const filter = buildFilter(query)

  const [items, total] = await Promise.all([
    Camera.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Camera.countDocuments(filter),
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

export async function createCamera(payload) {
  const existingCamera = await Camera.findOne({ name: payload.name })

  if (existingCamera) {
    const error = new Error('Camera name already exists')
    error.statusCode = 409
    throw error
  }

  return Camera.create(payload)
}

export async function getCameraById(id) {
  assertObjectId(id)

  const camera = await Camera.findById(id)

  if (!camera) {
    const error = new Error('Camera not found')
    error.statusCode = 404
    throw error
  }

  return camera
}

export async function updateCamera(id, payload) {
  assertObjectId(id)

  const camera = await Camera.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })

  if (!camera) {
    const error = new Error('Camera not found')
    error.statusCode = 404
    throw error
  }

  return camera
}

export async function deleteCamera(id) {
  assertObjectId(id)

  const camera = await Camera.findByIdAndDelete(id)

  if (!camera) {
    const error = new Error('Camera not found')
    error.statusCode = 404
    throw error
  }

  emitSocketEvent('camera:disconnected', {
    cameraId: camera._id,
    name: camera.name,
    status: 'deleted',
    timestamp: new Date().toISOString(),
  })

  return camera
}

export async function updateCameraStatus(id, status) {
  assertObjectId(id)

  if (!cameraStatuses.includes(status)) {
    const error = new Error('Invalid camera status')
    error.statusCode = 400
    throw error
  }

  const camera = await Camera.findByIdAndUpdate(
    id,
    {
      status,
      lastSeenAt: status === 'online' ? new Date() : null,
    },
    {
      new: true,
      runValidators: true,
    },
  )

  if (!camera) {
    const error = new Error('Camera not found')
    error.statusCode = 404
    throw error
  }

  emitSocketEvent(status === 'online' ? 'camera:connected' : 'camera:disconnected', {
    cameraId: camera._id,
    name: camera.name,
    location: camera.location,
    status: camera.status,
    timestamp: new Date().toISOString(),
  })

  return camera
}
