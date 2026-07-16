import { api } from './api'

export async function listAttendance(params = {}) {
  const response = await api.get('/attendance', { params })
  return response.data
}

export async function getAttendanceSummary(params = {}) {
  const response = await api.get('/attendance/summary', { params })
  return response.data
}

export async function markAttendance(payload) {
  const response = await api.post('/attendance/mark', payload)
  return response.data
}

export async function manualMarkAttendance(payload) {
  const response = await api.post('/attendance/manual-mark', payload)
  return response.data
}
