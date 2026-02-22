import { Router } from 'express';
import { authController } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/staff/:staffId/password', authMiddleware, authController.changePassword);
router.put('/students/:studentId/password', authMiddleware, authController.changePassword);
router.put('/staff/:staffId/email', authMiddleware, authController.changeEmail);
router.put('/students/:studentId/email', authMiddleware, authController.changeEmail);
router.delete('/:userId', authMiddleware, authController.deleteUser);

export default router;
