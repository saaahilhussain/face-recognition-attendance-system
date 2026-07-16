import { Admin } from './admin.model.js'
import { Attendance } from './attendance.model.js'
import { Camera } from './camera.model.js'
import { Employee } from './employee.model.js'

export const models = {
  Admin,
  Attendance,
  Camera,
  Employee,
}

export function getModelMetadata() {
  return Object.entries(models).map(([name, model]) => ({
    name,
    collection: model.collection.name,
    fields: Object.keys(model.schema.paths).filter((field) => !field.startsWith('__')),
  }))
}
