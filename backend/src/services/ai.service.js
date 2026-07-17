import { Employee } from '../models/employee.model.js'

function getAiServiceUrl() {
  return process.env.AI_SERVICE_URL || 'http://localhost:8000'
}

async function requestAiService(path, options = {}) {
  const response = await fetch(`${getAiServiceUrl()}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const error = new Error(data?.detail || 'AI service request failed')
    error.statusCode = response.status
    error.expose = true
    throw error
  }

  return data
}

export async function getAiRecognitionStatus() {
  return requestAiService('/recognition/status', {
    method: 'GET',
    headers: {},
  })
}

export async function detectFaces(imageBase64) {
  return requestAiService('/recognition/detect', {
    method: 'POST',
    body: JSON.stringify({ image_base64: imageBase64 }),
  })
}

function normalizeEmbedding(embedding) {
  const norm = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0))

  if (!norm) {
    return embedding
  }

  return embedding.map((value) => value / norm)
}

function averageEmbeddings(embeddings) {
  if (embeddings.length === 0) {
    return []
  }

  const length = embeddings[0].length
  const average = Array.from({ length }, (_, index) => {
    const total = embeddings.reduce((sum, embedding) => sum + embedding[index], 0)
    return total / embeddings.length
  })

  return normalizeEmbedding(average)
}

function getBestDetection(detections = []) {
  return detections
    .filter((detection) => Array.isArray(detection.embedding) && detection.embedding.length > 0)
    .sort((left, right) => {
      const rightConfidence = right.box?.confidence || 0
      const leftConfidence = left.box?.confidence || 0
      return rightConfidence - leftConfidence
    })[0]
}

export async function createFaceEmbeddingFromImages(registeredImages = []) {
  const embeddings = []
  const errors = []

  for (const image of registeredImages) {
    const result = await detectFaces(image.path)
    const detections = (result.detections || []).filter(
      (detection) => Array.isArray(detection.embedding) && detection.embedding.length > 0,
    )
    const label = image.label ? `${image.label} image` : 'Registered image'

    if (detections.length === 0) {
      errors.push(`${label} must contain a valid face`)
      continue
    }

    if (detections.length > 1) {
      errors.push(`${label} must contain only one face`)
      continue
    }

    embeddings.push(getBestDetection(detections).embedding)
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(', '))
    error.statusCode = 422
    throw error
  }

  return averageEmbeddings(embeddings)
}

export async function verifyEmployeeFace(imageBase64, employee, threshold = 0.45) {
  if (!Array.isArray(employee.faceEmbedding) || employee.faceEmbedding.length === 0) {
    const error = new Error('Employee face is not registered')
    error.statusCode = 422
    throw error
  }

  const result = await requestAiService('/recognition/recognize', {
    method: 'POST',
    body: JSON.stringify({
      image_base64: imageBase64,
      known_faces: [
        {
          employee_id: employee._id.toString(),
          employee_code: employee.employeeCode,
          full_name: employee.fullName,
          embedding: employee.faceEmbedding,
        },
      ],
      threshold,
    }),
  })

  const match = result.matches?.find((item) => item.status === 'recognized')

  if (!match) {
    const error = new Error('Face did not match employee code')
    error.statusCode = 401
    throw error
  }

  return {
    ...result,
    match,
  }
}

export async function recognizeFaces(imageBase64, threshold) {
  const employees = await Employee.find({
    status: 'active',
    faceEmbedding: { $exists: true, $not: { $size: 0 } },
  }).select('+faceEmbedding employeeCode fullName')

  const knownFaces = employees.map((employee) => ({
    employee_id: employee._id.toString(),
    employee_code: employee.employeeCode,
    full_name: employee.fullName,
    embedding: employee.faceEmbedding,
  }))

  return requestAiService('/recognition/recognize', {
    method: 'POST',
    body: JSON.stringify({
      image_base64: imageBase64,
      known_faces: knownFaces,
      threshold,
    }),
  })
}
