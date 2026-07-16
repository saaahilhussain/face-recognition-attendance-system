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
