import { Router } from 'express'
import { getSchemaMetadata } from '../controllers/database.controller.js'

const router = Router()

router.get('/schema', getSchemaMetadata)

export default router
