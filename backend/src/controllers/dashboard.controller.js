import { getDashboardOverview } from '../services/dashboard.service.js'

function handleDashboardError(error, res) {
  const statusCode = error.statusCode || 500

  return res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'failed',
    message: statusCode >= 500 ? 'Dashboard request failed' : error.message,
  })
}

export async function overview(req, res) {
  try {
    const dashboard = await getDashboardOverview(req.query.date)

    res.json({
      status: 'ok',
      dashboard,
    })
  } catch (error) {
    handleDashboardError(error, res)
  }
}
