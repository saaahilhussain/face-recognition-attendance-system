import { Attendance } from '../models/attendance.model.js'
import { Employee } from '../models/employee.model.js'
import { getMonthlyAttendanceReport } from './attendance.service.js'

function startOfDay(value = new Date()) {
  const date = new Date(value)
  date.setHours(0, 0, 0, 0)
  return date
}

function endOfDay(value = new Date()) {
  const date = new Date(value)
  date.setHours(23, 59, 59, 999)
  return date
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function htmlEscape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function pdfEscape(value) {
  return String(value ?? '')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)')
}

function toCsv(columns, rows) {
  return [
    columns.map((column) => csvEscape(column.label)).join(','),
    ...rows.map((row) =>
      columns.map((column) => csvEscape(row[column.key])).join(','),
    ),
  ].join('\r\n')
}

function toExcelHtml(title, columns, rows) {
  const head = columns
    .map((column) => `<th>${htmlEscape(column.label)}</th>`)
    .join('')
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => `<td>${htmlEscape(row[column.key])}</td>`)
          .join('')}</tr>`,
    )
    .join('')

  return `<!doctype html><html><head><meta charset="utf-8"><title>${htmlEscape(
    title,
  )}</title></head><body><h1>${htmlEscape(
    title,
  )}</h1><table border="1"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></body></html>`
}

function toSimplePdf(title, columns, rows) {
  const lines = [
    title,
    columns.map((column) => column.label).join(' | '),
    ...rows.map((row) =>
      columns
        .map((column) => String(row[column.key] ?? '').slice(0, 24))
        .join(' | '),
    ),
  ].slice(0, 48)

  const content = [
    'BT',
    '/F1 10 Tf',
    '50 790 Td',
    ...lines.flatMap((line, index) => [
      index === 0 ? '/F1 14 Tf' : '/F1 10 Tf',
      `(${pdfEscape(line)}) Tj`,
      '0 -16 Td',
    ]),
    'ET',
  ].join('\n')

  const objects = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n',
    '4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n',
    `5 0 obj << /Length ${Buffer.byteLength(
      content,
    )} >> stream\n${content}\nendstream endobj\n`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets = [0]

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf))
    pdf += object
  }

  const xrefOffset = Buffer.byteLength(pdf)
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('')
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`

  return Buffer.from(pdf)
}

function formatDate(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : ''
}

function formatDateTime(value) {
  return value ? new Date(value).toISOString() : ''
}

async function getDailyRows(date) {
  const records = await Attendance.find({
    date: {
      $gte: startOfDay(date),
      $lte: endOfDay(date),
    },
  })
    .populate('employee', 'employeeCode fullName department')
    .populate('camera', 'name location')
    .sort({ punchIn: 1 })

  return records.map((record) => ({
    employeeCode: record.employee?.employeeCode || '',
    fullName: record.employee?.fullName || '',
    department: record.employee?.department || '',
    date: formatDate(record.date),
    punchIn: formatDateTime(record.punchIn),
    punchOut: formatDateTime(record.punchOut),
    workingMinutes: record.workingHoursMinutes,
    status: record.status,
    camera: record.camera?.name || '',
    confidence: record.confidence ?? '',
  }))
}

async function getEmployeeRows(employeeId, query) {
  const employee = await Employee.findById(employeeId)

  if (!employee) {
    const error = new Error('Employee not found')
    error.statusCode = 404
    throw error
  }

  const filter = { employee: employee._id }

  if (query.from || query.to) {
    filter.date = {}

    if (query.from) {
      filter.date.$gte = startOfDay(query.from)
    }

    if (query.to) {
      filter.date.$lte = endOfDay(query.to)
    }
  }

  const records = await Attendance.find(filter).sort({ date: -1 })

  return records.map((record) => ({
    employeeCode: employee.employeeCode,
    fullName: employee.fullName,
    department: employee.department,
    date: formatDate(record.date),
    punchIn: formatDateTime(record.punchIn),
    punchOut: formatDateTime(record.punchOut),
    workingMinutes: record.workingHoursMinutes,
    status: record.status,
  }))
}

async function getMonthlyRows(query) {
  const report = await getMonthlyAttendanceReport(query)

  return report.rows.map((row) => ({
    employeeCode: row.employee.employeeCode,
    fullName: row.employee.fullName,
    department: row.employee.department,
    designation: row.employee.designation,
    presentDays: row.presentDays,
    absentDays: row.absentDays,
    completedDays: row.completedDays,
    pendingPunchOutDays: row.pendingPunchOutDays,
    workingHours: row.totalWorkingHours,
  }))
}

const reportColumns = {
  daily: [
    { key: 'employeeCode', label: 'Employee Code' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'department', label: 'Department' },
    { key: 'date', label: 'Date' },
    { key: 'punchIn', label: 'Punch In' },
    { key: 'punchOut', label: 'Punch Out' },
    { key: 'workingMinutes', label: 'Working Minutes' },
    { key: 'status', label: 'Status' },
    { key: 'camera', label: 'Camera' },
    { key: 'confidence', label: 'Confidence' },
  ],
  employee: [
    { key: 'employeeCode', label: 'Employee Code' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'department', label: 'Department' },
    { key: 'date', label: 'Date' },
    { key: 'punchIn', label: 'Punch In' },
    { key: 'punchOut', label: 'Punch Out' },
    { key: 'workingMinutes', label: 'Working Minutes' },
    { key: 'status', label: 'Status' },
  ],
  monthly: [
    { key: 'employeeCode', label: 'Employee Code' },
    { key: 'fullName', label: 'Full Name' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'presentDays', label: 'Present Days' },
    { key: 'absentDays', label: 'Absent Days' },
    { key: 'completedDays', label: 'Completed Days' },
    { key: 'pendingPunchOutDays', label: 'Pending Punch Out Days' },
    { key: 'workingHours', label: 'Working Hours' },
  ],
}

export async function buildReport({ type, query }) {
  const normalizedType = type || 'daily'
  const title = `${normalizedType[0].toUpperCase()}${normalizedType.slice(
    1,
  )} Attendance Report`
  let rows

  if (normalizedType === 'daily') {
    rows = await getDailyRows(query.date || new Date())
  } else if (normalizedType === 'monthly') {
    rows = await getMonthlyRows(query)
  } else if (normalizedType === 'employee') {
    rows = await getEmployeeRows(query.employeeId, query)
  } else {
    const error = new Error('Invalid report type')
    error.statusCode = 400
    throw error
  }

  return {
    title,
    type: normalizedType,
    columns: reportColumns[normalizedType],
    rows,
  }
}

export function renderReport(report, format = 'json') {
  if (format === 'csv') {
    return {
      body: toCsv(report.columns, report.rows),
      contentType: 'text/csv; charset=utf-8',
      extension: 'csv',
    }
  }

  if (format === 'excel' || format === 'xls') {
    return {
      body: toExcelHtml(report.title, report.columns, report.rows),
      contentType: 'application/vnd.ms-excel; charset=utf-8',
      extension: 'xls',
    }
  }

  if (format === 'pdf') {
    return {
      body: toSimplePdf(report.title, report.columns, report.rows),
      contentType: 'application/pdf',
      extension: 'pdf',
    }
  }

  return {
    body: {
      status: 'ok',
      report,
    },
    contentType: 'application/json',
    extension: 'json',
  }
}
