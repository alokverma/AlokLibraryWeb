import express from 'express';
import { login, verify } from '../controllers/authController.js';
import { authenticate } from '../utils/auth.js';

const router = express.Router();

// Login
router.post('/login', login);

// Verify token
router.get('/verify', authenticate, verify);

export default router;

