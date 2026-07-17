import { Attendance } from '../models/attendance.model.js'
import { Camera } from '../models/camera.model.js'
import { getTodayAttendanceSummary } from './attendance.service.js'

export async function getDashboardOverview(date = new Date()) {
  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)

  const [attendanceSummary, cameraStatus, recentActivity] = await Promise.all([
    getTodayAttendanceSummary(date),
    Camera.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]),
    Attendance.find({
      date: { $gte: dayStart, $lte: dayEnd },
    })
      .populate('employee', 'employeeCode fullName department')
      .populate('camera', 'name location status')
      .sort({ updatedAt: -1 })
      .limit(25),
  ])

  const cameraSummary = {
    total: 0,
    online: 0,
    offline: 0,
    disabled: 0,
  }

  for (const item of cameraStatus) {
    cameraSummary[item._id] = item.count
    cameraSummary.total += item.count
  }

  const visibleRecentActivity = recentActivity.filter((item) => item.employee)

  return {
    attendance: attendanceSummary,
    cameras: cameraSummary,
    recentActivity: visibleRecentActivity,
  }
}
