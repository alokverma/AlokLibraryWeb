import express from 'express';
import { authenticate } from '../utils/auth.js';
import * as noteController from '../controllers/noteController.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET all notes for the logged-in student
router.get('/', noteController.getAllNotes);

// GET note by ID
router.get('/:id', noteController.getNoteById);

// POST create new note
router.post('/', noteController.createNote);

// PUT update note
router.put('/:id', noteController.updateNote);

// DELETE note
router.delete('/:id', noteController.deleteNote);

export default router;

