import mongoose from 'mongoose'
import { Employee } from '../models/employee.model.js'
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

  const employee = await Employee.create(payload)

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

export async function getEmployeeById(id) {
  assertObjectId(id)

  const employee = await Employee.findById(id)

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
  const employee = await getEmployeeById(id)

  if (Array.isArray(payload.faceEmbedding)) {
    employee.faceEmbedding = payload.faceEmbedding
  }

  if (Array.isArray(payload.registeredImages)) {
    employee.registeredImages = payload.registeredImages
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
