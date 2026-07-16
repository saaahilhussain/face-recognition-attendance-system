import {
  detectFaces,
  getAiRecognitionStatus,
  recognizeFaces,
} from '../services/ai.service.js'

function validateImagePayload(payload) {
  if (!payload.imageBase64 || typeof payload.imageBase64 !== 'string') {
    return ['imageBase64 is required']
  }

  return []
}

function handleRecognitionError(error, res) {
  const statusCode = error.statusCode || 502

  res.status(statusCode).json({
    status: 'failed',
    message: error.message,
  })
}

export async function status(req, res) {
  try {
    const result = await getAiRecognitionStatus()

    res.json({
      status: 'ok',
      aiService: result,
    })
  } catch (error) {
    handleRecognitionError(error, res)
  }
}

export async function detect(req, res) {
  try {
    const errors = validateImagePayload(req.body)

    if (errors.length > 0) {
      return res.status(400).json({ status: 'failed', errors })
    }

    const result = await detectFaces(req.body.imageBase64)

    return res.json({
      status: 'ok',
      result,
    })
  } catch (error) {
    return handleRecognitionError(error, res)
  }
}

export async function recognize(req, res) {
  try {
    const errors = validateImagePayload(req.body)

    if (errors.length > 0) {
      return res.status(400).json({ status: 'failed', errors })
    }

    const result = await recognizeFaces(req.body.imageBase64, req.body.threshold)

    return res.json({
      status: 'ok',
      result,
    })
  } catch (error) {
    return handleRecognitionError(error, res)
  }
}
