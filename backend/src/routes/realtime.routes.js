import { Router } from 'express'
import { status } from '../controllers/realtime.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/status', status)

export default router
