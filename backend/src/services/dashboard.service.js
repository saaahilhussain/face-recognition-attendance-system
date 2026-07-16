import { Attendance } from '../models/attendance.model.js'
import { Camera } from '../models/camera.model.js'
import { getTodayAttendanceSummary } from './attendance.service.js'

export async function getDashboardOverview(date = new Date()) {
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
    Attendance.find()
      .populate('employee', 'employeeCode fullName department')
      .populate('camera', 'name location status')
      .sort({ updatedAt: -1 })
      .limit(10),
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

  return {
    attendance: attendanceSummary,
    cameras: cameraSummary,
    recentActivity,
  }
}
