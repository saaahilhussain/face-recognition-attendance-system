import { getDatabaseStatus } from '../config/database.js'

export function getHealth(req, res) {
  res.json({
    service: 'backend',
    status: 'ok',
    uptime: process.uptime(),
    database: getDatabaseStatus(),
    timestamp: new Date().toISOString(),
  })
}
