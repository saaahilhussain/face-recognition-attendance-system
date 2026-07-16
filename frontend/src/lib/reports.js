import { api } from './api'

function extensionFor(format) {
  if (format === 'excel') {
    return 'xls'
  }

  return format
}

async function downloadReport(path, params, filename) {
  const response = await api.get(path, {
    params,
    responseType: 'blob',
  })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function downloadDailyReport(params) {
  const format = params.format || 'csv'
  return downloadReport(
    '/reports/daily',
    params,
    `daily-attendance-report.${extensionFor(format)}`,
  )
}

export function downloadMonthlyReport(params) {
  const format = params.format || 'csv'
  return downloadReport(
    '/reports/monthly',
    params,
    `monthly-attendance-report.${extensionFor(format)}`,
  )
}

export function downloadEmployeeReport(employeeId, params) {
  const format = params.format || 'csv'
  return downloadReport(
    `/reports/employees/${employeeId}`,
    params,
    `employee-attendance-report.${extensionFor(format)}`,
  )
}
