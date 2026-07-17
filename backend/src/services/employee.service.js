import mongoose from 'mongoose'
import { Employee } from '../models/employee.model.js'
import { createFaceEmbeddingFromImages } from './ai.service.js'
import { emitSocketEvent } from '../socket/emitter.js'

function toEmployeeFilter(query) {
  const filter = {}

  if (query.status) {
    filter.status = query.status
  }

  if (query.department) {
    filter.department = query.department
  }

  if (query.search) {
    filter.$or = [
      { fullName: new RegExp(query.search, 'i') },
      { employeeCode: new RegExp(query.search, 'i') },
      { department: new RegExp(query.search, 'i') },
      { email: new RegExp(query.search, 'i') },
    ]
  }

  return filter
}

function assertObjectId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error('Invalid employee id')
    error.statusCode = 400
    throw error
  }
}

export async function listEmployees(query) {
  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  const skip = (page - 1) * limit
  const filter = toEmployeeFilter(query)

  const [items, total] = await Promise.all([
    Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Employee.countDocuments(filter),
  ])

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  }
}

export async function createEmployee(payload) {
  const existingEmployee = await Employee.findOne({
    employeeCode: payload.employeeCode,
  })

  if (existingEmployee) {
    const error = new Error('Employee code already exists')
    error.statusCode = 409
    throw error
  }

  const employeePayload = { ...payload }

  if (
    (!Array.isArray(employeePayload.faceEmbedding) || employeePayload.faceEmbedding.length === 0) &&
    Array.isArray(employeePayload.registeredImages) &&
    employeePayload.registeredImages.length > 0
  ) {
    employeePayload.faceEmbedding = await createFaceEmbeddingFromImages(
      employeePayload.registeredImages,
    )
  }

  const employee = await Employee.create(employeePayload)

  emitSocketEvent('employee:registered', {
    employee: {
      id: employee._id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      department: employee.department,
    },
  })

  return employee
}

export async function getEmployeeById(id, options = {}) {
  assertObjectId(id)

  const query = Employee.findById(id)

  if (options.includeFaceEmbedding) {
    query.select('+faceEmbedding')
  }

  const employee = await query

  if (!employee) {
    const error = new Error('Employee not found')
    error.statusCode = 404
    throw error
  }

  return employee
}

export async function getEmployeeByCode(employeeCode, options = {}) {
  const normalizedCode = String(employeeCode || '').trim().toUpperCase()

  if (!normalizedCode) {
    const error = new Error('Employee code is required')
    error.statusCode = 400
    throw error
  }

  const query = Employee.findOne({ employeeCode: normalizedCode })

  if (options.includeFaceEmbedding) {
    query.select('+faceEmbedding')
  }

  const employee = await query

  if (!employee) {
    const error = new Error('Employee not found')
    error.statusCode = 404
    throw error
  }

  return employee
}

export async function updateEmployee(id, payload) {
  assertObjectId(id)

  const employee = await Employee.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  })

  if (!employee) {
    const error = new Error('Employee not found')
    error.statusCode = 404
    throw error
  }

  return employee
}

export async function deleteEmployee(id) {
  assertObjectId(id)

  const employee = await Employee.findByIdAndDelete(id)

  if (!employee) {
    const error = new Error('Employee not found')
    error.statusCode = 404
    throw error
  }

  return employee
}

export async function saveFaceRegistration(id, payload) {
  const employee = await getEmployeeById(id, { includeFaceEmbedding: true })

  if (Array.isArray(payload.faceEmbedding)) {
    employee.faceEmbedding = payload.faceEmbedding
  }

  if (Array.isArray(payload.registeredImages)) {
    employee.registeredImages = payload.registeredImages

    if (!Array.isArray(payload.faceEmbedding)) {
      employee.faceEmbedding = await createFaceEmbeddingFromImages(payload.registeredImages)
    }
  }

  await employee.save()

  emitSocketEvent('employee:face_registered', {
    employee: {
      id: employee._id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
    },
    registeredImages: employee.registeredImages.length,
    hasEmbedding: employee.faceEmbedding.length > 0,
  })

  return employee
}
