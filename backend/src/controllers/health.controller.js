import { getDatabaseStatus } from '../config/database.js'
import { getModelMetadata } from '../models/index.js'

export function getHealth(req, res) {
  res.json({
    service: 'backend',
    status: 'ok',
    uptime: process.uptime(),
    database: getDatabaseStatus(),
    models: getModelMetadata().map((model) => model.name),
    timestamp: new Date().toISOString(),
  })
}
