import { Router } from 'express';
import { studentController } from '../controllers/studentController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', studentController.getStudents);
router.post('/', requireRole('admin', 'principal'), studentController.createStudent);
router.get('/:id', studentController.getStudent);
router.put('/:id', requireRole('admin', 'principal'), studentController.updateStudent);

export default router;
