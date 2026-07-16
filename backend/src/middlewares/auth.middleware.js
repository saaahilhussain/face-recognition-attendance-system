import { Admin } from '../models/admin.model.js'
import { verifyAuthToken } from '../services/auth.service.js'

function getBearerToken(req) {
  const authorization = req.headers.authorization || ''

  if (!authorization.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice('Bearer '.length).trim()
}

export async function requireAuth(req, res, next) {
  try {
    const token = getBearerToken(req)

    if (!token) {
      return res.status(401).json({
        status: 'unauthorized',
        message: 'Bearer token is required',
      })
    }

    const payload = verifyAuthToken(token)
    const admin = await Admin.findById(payload.sub)

    if (!admin || admin.status !== 'active') {
      return res.status(401).json({
        status: 'unauthorized',
        message: 'Session is invalid or expired',
      })
    }

    req.admin = admin
    req.auth = payload
    return next()
  } catch (error) {
    return res.status(401).json({
      status: 'unauthorized',
      message: 'Session is invalid or expired',
    })
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin || !allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        status: 'forbidden',
        message: 'You do not have permission to access this resource',
      })
    }

    return next()
  }
}
