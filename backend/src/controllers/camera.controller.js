import {
  createCamera,
  deleteCamera,
  getCameraById,
  getCameraOptions,
  listCameras,
  updateCamera,
  updateCameraStatus,
} from '../services/camera.service.js'

const allowedStatuses = ['online', 'offline', 'disabled']
const allowedTypes = ['webcam', 'ip_camera', 'iriun', 'other']

function validateCameraPayload(payload, partial = false) {
  const errors = []

  if (!partial || payload.name !== undefined) {
    if (!payload.name || payload.name.trim().length < 2) {
      errors.push('Camera name is required')
    }
  }

  if (!partial || payload.location !== undefined) {
    if (!payload.location || payload.location.trim().length < 2) {
      errors.push('Camera location is required')
    }
  }

  if (!partial || payload.source !== undefined) {
    if (!payload.source || payload.source.trim().length < 1) {
      errors.push('Camera source is required')
    }
  }

  if (payload.type && !allowedTypes.includes(payload.type)) {
    errors.push('Invalid camera type')
  }

  if (payload.status && !allowedStatuses.includes(payload.status)) {
    errors.push('Invalid camera status')
  }

  return errors
}

function handleCameraError(error, res) {
  const statusCode = error.statusCode || 500

  return res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'failed',
    message: statusCode >= 500 ? 'Camera request failed' : error.message,
  })
}

export function options(req, res) {
  res.json({
    status: 'ok',
    options: getCameraOptions(),
  })
}

export async function index(req, res) {
  try {
    const result = await listCameras(req.query)

    res.json({
      status: 'ok',
      ...result,
    })
  } catch (error) {
    handleCameraError(error, res)
  }
}

export async function store(req, res) {
  try {
    const errors = validateCameraPayload(req.body)

    if (errors.length > 0) {
      return res.status(400).json({ status: 'failed', errors })
    }

    const camera = await createCamera(req.body)

    return res.status(201).json({
      status: 'created',
      camera,
    })
  } catch (error) {
    return handleCameraError(error, res)
  }
}

export async function show(req, res) {
  try {
    const camera = await getCameraById(req.params.id)

    res.json({
      status: 'ok',
      camera,
    })
  } catch (error) {
    handleCameraError(error, res)
  }
}

export async function update(req, res) {
  try {
    const errors = validateCameraPayload(req.body, true)

    if (errors.length > 0) {
      return res.status(400).json({ status: 'failed', errors })
    }

    const camera = await updateCamera(req.params.id, req.body)

    return res.json({
      status: 'ok',
      camera,
    })
  } catch (error) {
    return handleCameraError(error, res)
  }
}

export async function destroy(req, res) {
  try {
    await deleteCamera(req.params.id)

    res.json({
      status: 'ok',
      message: 'Camera deleted',
    })
  } catch (error) {
    handleCameraError(error, res)
  }
}

export async function setStatus(req, res) {
  try {
    if (!req.body.status) {
      return res.status(400).json({
        status: 'failed',
        errors: ['Camera status is required'],
      })
    }

    const camera = await updateCameraStatus(req.params.id, req.body.status)

    return res.json({
      status: 'ok',
      camera,
    })
  } catch (error) {
    return handleCameraError(error, res)
  }
}
