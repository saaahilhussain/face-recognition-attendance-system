import { Router } from 'express'
import { markAttendance, registerEmployee } from '../controllers/public.controller.js'

const router = Router()

router.post('/employees/register', registerEmployee)
router.post('/attendance/mark', markAttendance)

export default router
