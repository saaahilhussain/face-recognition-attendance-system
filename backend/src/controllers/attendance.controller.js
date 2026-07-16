import {
  getTodayAttendanceSummary,
  listAttendance,
  markAttendanceForEmployee,
  recognizeAndMarkAttendance,
} from '../services/attendance.service.js'

function handleAttendanceError(error, res) {
  const statusCode = error.statusCode || 500

  return res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'failed',
    message: statusCode >= 500 ? 'Attendance request failed' : error.message,
  })
}

function validateImagePayload(payload) {
  if (!payload.imageBase64 || typeof payload.imageBase64 !== 'string') {
    return ['imageBase64 is required']
  }

  return []
}

export async function index(req, res) {
  try {
    const result = await listAttendance(req.query)

    res.json({
      status: 'ok',
      ...result,
    })
  } catch (error) {
    handleAttendanceError(error, res)
  }
}

export async function summary(req, res) {
  try {
    const result = await getTodayAttendanceSummary(req.query.date)

    res.json({
      status: 'ok',
      summary: result,
    })
  } catch (error) {
    handleAttendanceError(error, res)
  }
}

export async function mark(req, res) {
  try {
    const errors = validateImagePayload(req.body)

    if (errors.length > 0) {
      return res.status(400).json({ status: 'failed', errors })
    }

    const result = await recognizeAndMarkAttendance(req.body)

    return res.json({
      status: 'ok',
      ...result,
    })
  } catch (error) {
    return handleAttendanceError(error, res)
  }
}

export async function manualMark(req, res) {
  try {
    if (!req.body.employeeId) {
      return res.status(400).json({
        status: 'failed',
        errors: ['employeeId is required'],
      })
    }

    const result = await markAttendanceForEmployee({
      employeeId: req.body.employeeId,
      confidence: req.body.confidence,
      cameraId: req.body.cameraId,
      source: 'manual',
    })

    return res.json({
      status: 'ok',
      ...result,
    })
  } catch (error) {
    return handleAttendanceError(error, res)
  }
}
