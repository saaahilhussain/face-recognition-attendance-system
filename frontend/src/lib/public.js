import { api } from './api'

export async function registerEmployeePublic(payload) {
  const response = await api.post('/public/employees/register', payload)
  return response.data
}

export async function detectFacePublic(imageBase64) {
  const response = await api.post('/public/recognition/detect', {
    imageBase64,
  })

  return response.data
}

export async function checkEmployeePublic(employeeCode) {
  const response = await api.get(`/public/employees/${encodeURIComponent(employeeCode)}/check`)
  return response.data
}

export async function markAttendancePublic(payload) {
  const response = await api.post('/public/attendance/mark', payload)
  return response.data
}
