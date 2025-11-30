import express from 'express';
import { getCurrentAffairsData } from '../controllers/currentAffairsController.js';
import { authenticate } from '../utils/auth.js';

const router = express.Router();

// All current affairs routes require authentication
router.use(authenticate);

// GET current affairs (available to all authenticated users)
router.get('/', getCurrentAffairsData);

export default router;

