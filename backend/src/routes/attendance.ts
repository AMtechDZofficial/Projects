import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { getAttendance, upsertAttendance, bulkAttendance, getAttendanceSummary } from '../controllers/attendanceController';

const router = Router();
router.use(authenticate);

router.get('/summary', getAttendanceSummary);
router.get('/', getAttendance);
// Individual upsert: managers and operators can record attendance
router.post('/', requireRole('ADMIN', 'MANAGER'), upsertAttendance);
// Bulk (mark all present): managers only
router.post('/bulk', requireRole('ADMIN', 'MANAGER'), bulkAttendance);

export default router;
