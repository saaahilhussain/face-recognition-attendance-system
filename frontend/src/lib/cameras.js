import { api } from './api'

export async function listCameras(params = {}) {
  const response = await api.get('/cameras', { params })
  return response.data
}

export async function createCamera(payload) {
  const response = await api.post('/cameras', payload)
  return response.data
}

export async function updateCamera(id, payload) {
  const response = await api.patch(`/cameras/${id}`, payload)
  return response.data
}

export async function updateCameraStatus(id, status) {
  const response = await api.patch(`/cameras/${id}/status`, { status })
  return response.data
}

export async function deleteCamera(id) {
  const response = await api.delete(`/cameras/${id}`)
  return response.data
}
