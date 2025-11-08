import express from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  resetStudentPassword,
} from '../controllers/studentController.js';
import { authenticate, authorize } from '../utils/auth.js';

const router = express.Router();

// All student routes require authentication
router.use(authenticate);

// GET all students (filtered by role)
router.get('/', getAllStudents);

// POST create new student (admin/teacher only)
router.post('/', authorize('admin', 'teacher'), createStudent);

// POST reset student password (admin/teacher only)
router.post('/:id/reset-password', authorize('admin', 'teacher'), resetStudentPassword);

// GET student by ID (students can only see their own data)
router.get('/:id', getStudentById);

// PUT update student (admin/teacher only)
router.put('/:id', authorize('admin', 'teacher'), updateStudent);

// DELETE student (admin/teacher only)
router.delete('/:id', authorize('admin', 'teacher'), deleteStudent);

export default router;

