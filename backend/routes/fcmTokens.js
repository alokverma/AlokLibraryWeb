import express from 'express';
import {
  registerToken,
  removeToken,
  getToken,
} from '../controllers/fcmTokenController.js';
import { authenticate } from '../utils/auth.js';

const router = express.Router();

// All FCM token routes require authentication
router.use(authenticate);

// GET current FCM token for authenticated student
router.get('/', getToken);

// POST register/update FCM token for authenticated student
router.post('/', registerToken);

// DELETE remove FCM token for authenticated student
// Supports both: token in body (recommended) or token in URL path
router.delete('/:token?', removeToken);

export default router;

