import {
  loginAdmin,
  registerAdmin,
  sanitizeAdmin,
} from '../services/auth.service.js'

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function validateAuthPayload({ name, email, password }, requireName = false) {
  const errors = []

  if (requireName && (!name || name.trim().length < 2)) {
    errors.push('Name must be at least 2 characters')
  }

  if (!email || !isValidEmail(email)) {
    errors.push('Valid email is required')
  }

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }

  return errors
}

function handleAuthError(error, res) {
  const statusCode = error.statusCode || 500

  return res.status(statusCode).json({
    status: statusCode >= 500 ? 'error' : 'failed',
    message: statusCode >= 500 ? 'Authentication request failed' : error.message,
  })
}

export async function register(req, res) {
  try {
    const errors = validateAuthPayload(req.body, true)

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'failed',
        errors,
      })
    }

    const result = await registerAdmin(req.body)

    return res.status(201).json({
      status: 'created',
      ...result,
    })
  } catch (error) {
    return handleAuthError(error, res)
  }
}

export async function login(req, res) {
  try {
    const errors = validateAuthPayload(req.body)

    if (errors.length > 0) {
      return res.status(400).json({
        status: 'failed',
        errors,
      })
    }

    const result = await loginAdmin(req.body)

    return res.json({
      status: 'ok',
      ...result,
    })
  } catch (error) {
    return handleAuthError(error, res)
  }
}

export function getSession(req, res) {
  res.json({
    status: 'ok',
    admin: sanitizeAdmin(req.admin),
  })
}

export function logout(req, res) {
  res.json({
    status: 'ok',
    message: 'Logout successful. Remove the token on the client.',
  })
}
