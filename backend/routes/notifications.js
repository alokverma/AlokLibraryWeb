import express from 'express';
import {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification,
} from '../controllers/notificationController.js';
import { authenticate, authorize } from '../utils/auth.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

// GET all notifications (students see only active, teachers/admin see all)
router.get('/', getAllNotifications);

// GET notification by ID
router.get('/:id', getNotificationById);

// POST create notification (teacher/admin only)
router.post('/', authorize('admin', 'teacher'), createNotification);

// PUT update notification (teacher/admin only)
router.put('/:id', authorize('admin', 'teacher'), updateNotification);

// DELETE notification (teacher/admin only)
router.delete('/:id', authorize('admin', 'teacher'), deleteNotification);

export default router;

