import { getSocketStatus } from '../socket/emitter.js'

export function status(req, res) {
  res.json({
    status: 'ok',
    realtime: getSocketStatus(),
    events: [
      'camera:connected',
      'camera:disconnected',
      'recognition:started',
      'recognition:success',
      'recognition:failed',
      'attendance:marked',
      'employee:registered',
      'employee:face_registered',
    ],
  })
}
