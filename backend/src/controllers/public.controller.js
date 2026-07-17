import { markAttendanceForEmployee } from '../services/attendance.service.js'
import { createEmployee, getEmployeeByCode } from '../services/employee.service.js'

const imageLabels = ['front', 'left', 'right', 'other']

function validateEmployeePayload(payload) {
  const errors = []

  if (!payload.employeeCode || payload.employeeCode.trim().length < 2) {
    errors.push('Employee code is required')
  }

  if (!payload.fullName || payload.fullName.trim().length < 2) {
    errors.push('Full name is required')
  }

  if (!payload.department || payload.department.trim().length < 2) {
    errors.push('Department is required')
  }

  if (!Array.isArray(payload.registeredImages) || payload.registeredImages.length === 0) {
    errors.push('At least one face image is required')
  } else {
    for (const image of payload.registeredImages) {
      if (!imageLabels.includes(image.label) || !image.path) {
        errors.push('Each face image must include a valid label and image data')
        break
      }
    }
  }

  return errors
}

function handlePublicError(error, res) {
  const statusCode = error.statusCode || 500

  return res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'failed',
    message: statusCode >= 500 ? 'Public request failed' : error.message,
  })
}

export async function registerEmployee(req, res) {
  try {
    const errors = validateEmployeePayload(req.body)

    if (errors.length > 0) {
      return res.status(400).json({ status: 'failed', errors })
    }

    const employee = await createEmployee(req.body)

    return res.status(201).json({
      status: 'created',
      employee,
    })
  } catch (error) {
    return handlePublicError(error, res)
  }
}

export async function markAttendance(req, res) {
  try {
    const employeeCode = String(req.body.employeeCode || '').trim()
    const employeeId = String(req.body.employeeId || '').trim()

    if (!employeeCode && !employeeId) {
      return res.status(400).json({
        status: 'failed',
        errors: ['employeeCode or employeeId is required'],
      })
    }

    let resolvedEmployeeId = employeeId

    if (employeeCode) {
      const employee = await getEmployeeByCode(employeeCode)
      resolvedEmployeeId = employee._id.toString()
    }

    const result = await markAttendanceForEmployee({
      employeeId: resolvedEmployeeId,
      source: 'public',
    })

    return res.json({
      status: 'ok',
      ...result,
    })
  } catch (error) {
    return handlePublicError(error, res)
  }
}
