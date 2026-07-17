import { markAttendanceForEmployee } from '../services/attendance.service.js'
import { detectFaces, verifyEmployeeFace } from '../services/ai.service.js'
import { createEmployee, getEmployeeByCode, getEmployeeById } from '../services/employee.service.js'

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
  const message = statusCode >= 500 && !error.expose ? 'Public request failed' : error.message

  console.error(`Public request failed: ${error.message}`)

  return res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'failed',
    message,
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

export async function checkEmployee(req, res) {
  try {
    const employee = await getEmployeeByCode(req.params.employeeCode)

    return res.json({
      status: 'ok',
      employee: {
        id: employee._id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        department: employee.department,
      },
    })
  } catch (error) {
    return handlePublicError(error, res)
  }
}

export async function markAttendance(req, res) {
  try {
    const employeeCode = String(req.body.employeeCode || '').trim()
    const employeeId = String(req.body.employeeId || '').trim()
    const requestedAction = req.body.action || null
    const imageBase64 = String(req.body.imageBase64 || '').trim()

    if (!employeeCode && !employeeId) {
      return res.status(400).json({
        status: 'failed',
        errors: ['employeeCode or employeeId is required'],
      })
    }

    if (!imageBase64) {
      return res.status(400).json({
        status: 'failed',
        errors: ['imageBase64 is required'],
      })
    }

    let resolvedEmployeeId = employeeId
    let employee = null

    if (employeeCode) {
      employee = await getEmployeeByCode(employeeCode, { includeFaceEmbedding: true })
      resolvedEmployeeId = employee._id.toString()
    }

    if (!employee) {
      employee = await getEmployeeById(employeeId, { includeFaceEmbedding: true })
    }

    await verifyEmployeeFace(imageBase64, employee, req.body.threshold)

    const result = await markAttendanceForEmployee({
      employeeId: resolvedEmployeeId,
      source: 'public',
      requestedAction,
    })

    return res.json({
      status: 'ok',
      ...result,
    })
  } catch (error) {
    return handlePublicError(error, res)
  }
}

export async function detectFace(req, res) {
  try {
    const imageBase64 = String(req.body.imageBase64 || '').trim()

    if (!imageBase64) {
      return res.status(400).json({
        status: 'failed',
        errors: ['imageBase64 is required'],
      })
    }

    const result = await detectFaces(imageBase64)

    return res.json({
      status: 'ok',
      result,
    })
  } catch (error) {
    return handlePublicError(error, res)
  }
}
