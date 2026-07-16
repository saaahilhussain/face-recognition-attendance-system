import { Router } from 'express'
import {
  history,
  index,
  manualMark,
  mark,
  monthlyReport,
  summary,
} from '../controllers/attendance.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', index)
router.get('/summary', summary)
router.get('/monthly-report', monthlyReport)
router.get('/employees/:employeeId/history', history)
router.post('/mark', mark)
router.post('/manual-mark', manualMark)

export default router
