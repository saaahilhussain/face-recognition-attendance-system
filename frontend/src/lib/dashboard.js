import { api } from './api'

export async function getDashboardOverview(params = {}) {
  const response = await api.get('/dashboard/overview', { params })
  return response.data
}
