import { Router } from 'express'
import {
  destroy,
  index,
  options,
  setStatus,
  show,
  store,
  update,
} from '../controllers/camera.controller.js'
import { requireAuth } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(requireAuth)

router.get('/options', options)
router.get('/', index)
router.post('/', store)
router.get('/:id', show)
router.patch('/:id', update)
router.patch('/:id/status', setStatus)
router.delete('/:id', destroy)

export default router
