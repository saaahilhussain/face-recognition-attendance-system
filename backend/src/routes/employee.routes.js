import { Router } from 'express'
import {
  destroy,
  index,
  registerFace,
  show,
  store,
  update,
} from '../controllers/employee.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/', index)
router.post('/', store)
router.get('/:id', show)
router.patch('/:id', update)
router.delete('/:id', destroy)
router.post('/:id/face-registration', registerFace)

export default router
