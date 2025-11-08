import express from 'express';
import { getMonthlyStatistics } from '../controllers/analyticsController.js';
import { authenticate, authorize } from '../utils/auth.js';

const router = express.Router();

// All analytics routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// GET monthly statistics
router.get('/monthly', getMonthlyStatistics);

export default router;

