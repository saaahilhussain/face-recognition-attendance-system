import { buildReport, renderReport } from '../services/report.service.js'

function handleReportError(error, res) {
  const statusCode = error.statusCode || 500

  return res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'failed',
    message: statusCode >= 500 ? 'Report request failed' : error.message,
  })
}

async function sendReport(req, res, type) {
  try {
    const format = req.query.format || 'json'
    const report = await buildReport({
      type,
      query: {
        ...req.query,
        employeeId: req.params.employeeId,
      },
    })
    const rendered = renderReport(report, format)
    const filename = `${report.type}-attendance-report.${rendered.extension}`

    if (rendered.contentType === 'application/json') {
      return res.json(rendered.body)
    }

    res.setHeader('Content-Type', rendered.contentType)
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.send(rendered.body)
  } catch (error) {
    return handleReportError(error, res)
  }
}

export function dailyReport(req, res) {
  return sendReport(req, res, 'daily')
}

export function monthlyReport(req, res) {
  return sendReport(req, res, 'monthly')
}

export function employeeReport(req, res) {
  return sendReport(req, res, 'employee')
}
