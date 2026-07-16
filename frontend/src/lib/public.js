import { api } from './api'

export async function registerEmployeePublic(payload) {
  const response = await api.post('/public/employees/register', payload)
  return response.data
}

export async function markAttendancePublic(payload) {
  const response = await api.post('/public/attendance/mark', payload)
  return response.data
}
