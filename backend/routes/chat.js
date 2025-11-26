import express from 'express';
import { chat } from '../controllers/chatController.js';
import { authenticate } from '../utils/auth.js';

const router = express.Router();

// All chat routes require authentication
router.use(authenticate);

// POST send chat message
router.post('/', chat);

export default router;

