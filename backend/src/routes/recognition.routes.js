import { Router } from 'express'
import { detect, recognize, status } from '../controllers/recognition.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/status', status)
router.post('/detect', detect)
router.post('/recognize', recognize)

export default router
