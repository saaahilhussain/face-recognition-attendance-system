import { Router } from 'express'
import { checkEmployee, detectFace, markAttendance, registerEmployee } from '../controllers/public.controller.js'

const router = Router()

router.post('/employees/register', registerEmployee)
router.get('/employees/:employeeCode/check', checkEmployee)
router.post('/recognition/detect', detectFace)
router.post('/attendance/mark', markAttendance)

export default router
