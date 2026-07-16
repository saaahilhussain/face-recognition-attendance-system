import {
  createEmployee,
  deleteEmployee,
  getEmployeeById,
  listEmployees,
  saveFaceRegistration,
  updateEmployee,
} from '../services/employee.service.js'

const allowedStatuses = ['active', 'inactive']
const imageLabels = ['front', 'left', 'right', 'other']

function validateEmployeePayload(payload, partial = false) {
  const errors = []

  if (!partial || payload.employeeCode !== undefined) {
    if (!payload.employeeCode || payload.employeeCode.trim().length < 2) {
      errors.push('Employee code is required')
    }
  }

  if (!partial || payload.fullName !== undefined) {
    if (!payload.fullName || payload.fullName.trim().length < 2) {
      errors.push('Full name is required')
    }
  }

  if (!partial || payload.department !== undefined) {
    if (!payload.department || payload.department.trim().length < 2) {
      errors.push('Department is required')
    }
  }

  if (payload.status && !allowedStatuses.includes(payload.status)) {
    errors.push('Status must be active or inactive')
  }

  return errors
}

function validateFacePayload(payload) {
  const errors = []

  if (
    payload.faceEmbedding !== undefined &&
    (!Array.isArray(payload.faceEmbedding) ||
      payload.faceEmbedding.some((value) => typeof value !== 'number'))
  ) {
    errors.push('Face embedding must be an array of numbers')
  }

  if (payload.registeredImages !== undefined) {
    if (!Array.isArray(payload.registeredImages)) {
      errors.push('Registered images must be an array')
    } else {
      for (const image of payload.registeredImages) {
        if (!imageLabels.includes(image.label) || !image.path) {
          errors.push('Each image must include a valid label and path')
          break
        }
      }
    }
  }

  return errors
}

function handleEmployeeError(error, res) {
  const statusCode = error.statusCode || 500

  return res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'failed',
    message: statusCode >= 500 ? 'Employee request failed' : error.message,
  })
}

export async function index(req, res) {
  try {
    const result = await listEmployees(req.query)

    res.json({
      status: 'ok',
      ...result,
    })
  } catch (error) {
    handleEmployeeError(error, res)
  }
}

export async function store(req, res) {
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
    return handleEmployeeError(error, res)
  }
}

export async function show(req, res) {
  try {
    const employee = await getEmployeeById(req.params.id)

    res.json({
      status: 'ok',
      employee,
    })
  } catch (error) {
    handleEmployeeError(error, res)
  }
}

export async function update(req, res) {
  try {
    const errors = validateEmployeePayload(req.body, true)

    if (errors.length > 0) {
      return res.status(400).json({ status: 'failed', errors })
    }

    const employee = await updateEmployee(req.params.id, req.body)

    return res.json({
      status: 'ok',
      employee,
    })
  } catch (error) {
    return handleEmployeeError(error, res)
  }
}

export async function destroy(req, res) {
  try {
    await deleteEmployee(req.params.id)

    res.json({
      status: 'ok',
      message: 'Employee deleted',
    })
  } catch (error) {
    handleEmployeeError(error, res)
  }
}

export async function registerFace(req, res) {
  try {
    const errors = validateFacePayload(req.body)

    if (errors.length > 0) {
      return res.status(400).json({ status: 'failed', errors })
    }

    const employee = await saveFaceRegistration(req.params.id, req.body)

    return res.json({
      status: 'ok',
      message: 'Face registration data saved',
      employee,
    })
  } catch (error) {
    return handleEmployeeError(error, res)
  }
}
