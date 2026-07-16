import { Router } from 'express'
import { index, manualMark, mark, summary } from '../controllers/attendance.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', index)
router.get('/summary', summary)
router.post('/mark', mark)
router.post('/manual-mark', manualMark)

export default router
