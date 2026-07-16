import { Router } from 'express'
import {
  dailyReport,
  employeeReport,
  monthlyReport,
} from '../controllers/report.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/daily', dailyReport)
router.get('/monthly', monthlyReport)
router.get('/employees/:employeeId', employeeReport)

export default router
