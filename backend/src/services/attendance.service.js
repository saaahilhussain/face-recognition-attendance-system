import mongoose from 'mongoose'
import { Attendance } from '../models/attendance.model.js'
import { Employee } from '../models/employee.model.js'
import { recognizeFaces } from './ai.service.js'
import { emitSocketEvent } from '../socket/emitter.js'

const defaultPunchOutCooldownMinutes = 1

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

function assertObjectId(id, label) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const error = new Error(`Invalid ${label}`)
    error.statusCode = 400
    throw error
  }
}

function getPunchOutCooldownMinutes() {
  return (
    Number(process.env.ATTENDANCE_PUNCH_OUT_COOLDOWN_MINUTES) ||
    defaultPunchOutCooldownMinutes
  )
}

function calculateWorkingMinutes(punchIn, punchOut) {
  if (!punchIn || !punchOut) {
    return 0
  }

  return Math.max(Math.round((punchOut.getTime() - punchIn.getTime()) / 60000), 0)
}

function serializeAttendance(attendance, employee) {
  return {
    id: attendance._id,
    employee: employee
      ? {
          id: employee._id,
          employeeCode: employee.employeeCode,
          fullName: employee.fullName,
          department: employee.department,
        }
      : attendance.employee,
    date: attendance.date,
    punchIn: attendance.punchIn,
    punchOut: attendance.punchOut,
    workingHoursMinutes: attendance.workingHoursMinutes,
    status: attendance.status,
    confidence: attendance.confidence,
    camera: attendance.camera,
  }
}

export async function listAttendance(query) {
  const filter = {}

  if (query.date) {
    filter.date = {
      $gte: startOfDay(query.date),
      $lte: endOfDay(query.date),
    }
  }

  if (query.employeeId) {
    assertObjectId(query.employeeId, 'employee id')
    filter.employee = query.employeeId
  }

  if (query.status) {
    filter.status = query.status
  }

  const page = Math.max(Number(query.page) || 1, 1)
  const limit = Math.min(Math.max(Number(query.limit) || 20, 1), 100)
  const skip = (page - 1) * limit

  const [items, total] = await Promise.all([
    Attendance.find(filter)
      .populate('employee', 'employeeCode fullName department')
      .populate('camera', 'name location status')
      .sort({ date: -1, punchIn: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments(filter),
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

export async function getTodayAttendanceSummary(date = new Date()) {
  const dayStart = startOfDay(date)
  const dayEnd = endOfDay(date)

  const [totalEmployees, present, completed, pendingPunchOut] = await Promise.all([
    Employee.countDocuments({ status: 'active' }),
    Attendance.countDocuments({
      date: { $gte: dayStart, $lte: dayEnd },
      punchIn: { $ne: null },
    }),
    Attendance.countDocuments({
      date: { $gte: dayStart, $lte: dayEnd },
      punchOut: { $ne: null },
    }),
    Attendance.countDocuments({
      date: { $gte: dayStart, $lte: dayEnd },
      punchIn: { $ne: null },
      punchOut: null,
    }),
  ])

  return {
    date: dayStart,
    totalEmployees,
    present,
    absent: Math.max(totalEmployees - present, 0),
    completed,
    pendingPunchOut,
  }
}

export async function markAttendanceForEmployee({
  employeeId,
  confidence = null,
  cameraId = null,
  markedAt = new Date(),
  source = 'manual',
}) {
  assertObjectId(employeeId, 'employee id')

  if (cameraId) {
    assertObjectId(cameraId, 'camera id')
  }

  const employee = await Employee.findOne({ _id: employeeId, status: 'active' })

  if (!employee) {
    const error = new Error('Active employee not found')
    error.statusCode = 404
    throw error
  }

  const day = startOfDay(markedAt)
  let attendance = await Attendance.findOne({
    employee: employee._id,
    date: day,
  })

  let action = 'ignored'
  let message = 'Attendance already completed for today'

  if (!attendance) {
    attendance = await Attendance.create({
      employee: employee._id,
      date: day,
      punchIn: markedAt,
      status: 'present',
      confidence,
      camera: cameraId,
      notes: `Marked by ${source}`,
    })
    await Employee.findByIdAndUpdate(employee._id, {
      $addToSet: { attendanceReferences: attendance._id },
    })
    action = 'punch_in'
    message = 'Punch in recorded'
  } else if (!attendance.punchOut) {
    const elapsedMinutes = calculateWorkingMinutes(attendance.punchIn, markedAt)

    if (elapsedMinutes < getPunchOutCooldownMinutes()) {
      action = 'duplicate'
      message = 'Duplicate recognition ignored'
    } else {
      attendance.punchOut = markedAt
      attendance.workingHoursMinutes = elapsedMinutes
      attendance.confidence = confidence ?? attendance.confidence
      attendance.camera = cameraId || attendance.camera
      attendance.status = 'present'
      await attendance.save()
      action = 'punch_out'
      message = 'Punch out recorded'
    }
  }

  const payload = {
    action,
    message,
    attendance: serializeAttendance(attendance, employee),
    timestamp: new Date().toISOString(),
  }

  if (action !== 'duplicate' && action !== 'ignored') {
    emitSocketEvent('attendance:marked', payload)
  }

  return payload
}

export async function recognizeAndMarkAttendance({
  imageBase64,
  threshold,
  cameraId = null,
}) {
  const recognition = await recognizeFaces(imageBase64, threshold)
  const match = recognition.matches?.find((item) => item.status === 'recognized')

  if (!match?.employee_id) {
    return {
      action: 'unknown',
      message: 'No registered employee recognized',
      recognition,
      timestamp: new Date().toISOString(),
    }
  }

  const result = await markAttendanceForEmployee({
    employeeId: match.employee_id,
    confidence: match.confidence,
    cameraId,
    source: 'recognition',
  })

  return {
    ...result,
    recognition,
  }
}
