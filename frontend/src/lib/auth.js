import { api } from './api'

export async function loginAdmin(credentials) {
  const response = await api.post('/auth/login', credentials)
  localStorage.setItem('auth_token', response.data.token)
  return response.data
}

export async function registerAdmin(payload) {
  const response = await api.post('/auth/register', payload)
  localStorage.setItem('auth_token', response.data.token)
  return response.data
}

export async function getSession() {
  const response = await api.get('/auth/me')
  return response.data
}

export async function logoutAdmin() {
  await api.post('/auth/logout')
  localStorage.removeItem('auth_token')
}

export function clearAuthToken() {
  localStorage.removeItem('auth_token')
}
