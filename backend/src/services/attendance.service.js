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
  } else if (query.from || query.to) {
    filter.date = {}

    if (query.from) {
      filter.date.$gte = startOfDay(query.from)
    }

    if (query.to) {
      filter.date.$lte = endOfDay(query.to)
    }
  }

  if (query.employeeId) {
    assertObjectId(query.employeeId, 'employee id')
    filter.employee = query.employeeId
  }

  if (query.status) {
    filter.status = query.status
  }

  if (query.department) {
    const employees = await Employee.find({
      department: new RegExp(query.department, 'i'),
    }).select('_id')
    filter.employee = { $in: employees.map((employee) => employee._id) }
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

export async function getEmployeeAttendanceHistory(employeeId, query) {
  assertObjectId(employeeId, 'employee id')

  return listAttendance({
    ...query,
    employeeId,
  })
}

export async function getMonthlyAttendanceReport(query) {
  const year = Number(query.year) || new Date().getFullYear()
  const month = Number(query.month) || new Date().getMonth() + 1
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 0, 23, 59, 59, 999)

  const employees = await Employee.find({ status: 'active' })
    .select('employeeCode fullName department designation')
    .sort({ fullName: 1 })

  const attendanceRecords = await Attendance.find({
    date: {
      $gte: start,
      $lte: end,
    },
  }).select('employee date punchIn punchOut workingHoursMinutes status')

  const attendanceByEmployee = new Map()

  for (const record of attendanceRecords) {
    const employeeId = record.employee.toString()
    const current = attendanceByEmployee.get(employeeId) || {
      presentDays: 0,
      completedDays: 0,
      pendingPunchOutDays: 0,
      totalWorkingMinutes: 0,
      records: [],
    }

    if (record.punchIn) {
      current.presentDays += 1
    }

    if (record.punchOut) {
      current.completedDays += 1
    }

    if (record.punchIn && !record.punchOut) {
      current.pendingPunchOutDays += 1
    }

    current.totalWorkingMinutes += record.workingHoursMinutes || 0
    current.records.push(record)
    attendanceByEmployee.set(employeeId, current)
  }

  const daysInMonth = new Date(year, month, 0).getDate()
  const rows = employees.map((employee) => {
    const summary = attendanceByEmployee.get(employee._id.toString()) || {
      presentDays: 0,
      completedDays: 0,
      pendingPunchOutDays: 0,
      totalWorkingMinutes: 0,
      records: [],
    }

    return {
      employee: {
        id: employee._id,
        employeeCode: employee.employeeCode,
        fullName: employee.fullName,
        department: employee.department,
        designation: employee.designation,
      },
      presentDays: summary.presentDays,
      absentDays: Math.max(daysInMonth - summary.presentDays, 0),
      completedDays: summary.completedDays,
      pendingPunchOutDays: summary.pendingPunchOutDays,
      totalWorkingMinutes: summary.totalWorkingMinutes,
      totalWorkingHours: Number((summary.totalWorkingMinutes / 60).toFixed(2)),
    }
  })

  return {
    year,
    month,
    daysInMonth,
    rows,
    totals: {
      employees: rows.length,
      presentDays: rows.reduce((total, row) => total + row.presentDays, 0),
      absentDays: rows.reduce((total, row) => total + row.absentDays, 0),
      workingMinutes: rows.reduce(
        (total, row) => total + row.totalWorkingMinutes,
        0,
      ),
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
  emitSocketEvent('recognition:started', {
    mode: 'attendance',
    cameraId,
  })

  let recognition

  try {
    recognition = await recognizeFaces(imageBase64, threshold)
  } catch (error) {
    emitSocketEvent('recognition:failed', {
      mode: 'attendance',
      cameraId,
      message: error.message,
    })
    throw error
  }

  const match = recognition.matches?.find((item) => item.status === 'recognized')

  if (!match?.employee_id) {
    emitSocketEvent('recognition:failed', {
      mode: 'attendance',
      cameraId,
      message: 'No registered employee recognized',
    })

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

  emitSocketEvent('recognition:success', {
    mode: 'attendance',
    cameraId,
    employeeId: match.employee_id,
    confidence: match.confidence,
    action: result.action,
  })

  return {
    ...result,
    recognition,
  }
}
