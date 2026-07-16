import { Router } from 'express'
import { overview } from '../controllers/dashboard.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/overview', overview)

export default router
