import { Router } from 'express'
import { getSession, login, logout, register } from '../controllers/auth.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.get('/me', requireAuth, getSession)
router.post('/logout', requireAuth, logout)

export default router
