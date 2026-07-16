import { getModelMetadata } from '../models/index.js'

export function getSchemaMetadata(req, res) {
  res.json({
    service: 'backend',
    status: 'ok',
    models: getModelMetadata(),
    timestamp: new Date().toISOString(),
  })
}
