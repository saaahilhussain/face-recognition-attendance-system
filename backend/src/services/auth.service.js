import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Admin } from '../models/admin.model.js'

const saltRounds = 12
const tokenExpiry = '1d'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is required')
  }

  return secret
}

export function sanitizeAdmin(admin) {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    status: admin.status,
    lastLoginAt: admin.lastLoginAt,
    createdAt: admin.createdAt,
    updatedAt: admin.updatedAt,
  }
}

export function signAuthToken(admin) {
  return jwt.sign(
    {
      sub: admin._id.toString(),
      role: admin.role,
      email: admin.email,
    },
    getJwtSecret(),
    { expiresIn: tokenExpiry },
  )
}

export function verifyAuthToken(token) {
  return jwt.verify(token, getJwtSecret())
}

export async function registerAdmin({ name, email, password, role = 'admin' }) {
  const existingAdmin = await Admin.findOne({ email })

  if (existingAdmin) {
    const error = new Error('Admin with this email already exists')
    error.statusCode = 409
    throw error
  }

  const passwordHash = await bcrypt.hash(password, saltRounds)
  const admin = await Admin.create({
    name,
    email,
    passwordHash,
    role,
  })

  return {
    admin: sanitizeAdmin(admin),
    token: signAuthToken(admin),
  }
}

export async function loginAdmin({ email, password }) {
  const admin = await Admin.findOne({ email }).select('+passwordHash')

  if (!admin) {
    const error = new Error('Invalid email or password')
    error.statusCode = 401
    throw error
  }

  if (admin.status !== 'active') {
    const error = new Error('Admin account is disabled')
    error.statusCode = 403
    throw error
  }

  const passwordMatches = await bcrypt.compare(password, admin.passwordHash)

  if (!passwordMatches) {
    const error = new Error('Invalid email or password')
    error.statusCode = 401
    throw error
  }

  admin.lastLoginAt = new Date()
  await admin.save()

  return {
    admin: sanitizeAdmin(admin),
    token: signAuthToken(admin),
  }
}
