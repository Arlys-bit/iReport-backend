import { Router } from 'express';
import { reportController } from '../controllers/reportController.js';
import { authMiddleware, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', reportController.getReports);
router.post('/', reportController.createReport);
router.get('/:id', reportController.getReport);
router.put('/:id/status', requireRole('admin', 'principal', 'guidance'), reportController.updateReportStatus);
router.delete('/:id', requireRole('admin', 'principal'), reportController.deleteReport);

export default router;
