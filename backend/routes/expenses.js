import express from 'express';
import { authenticate, authorize } from '../utils/auth.js';
import * as expenseController from '../controllers/expenseController.js';

const router = express.Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(authorize('admin'));

// GET all expenses
router.get('/', expenseController.getAllExpenses);

// GET monthly expenses statistics
router.get('/monthly', expenseController.getMonthlyExpenses);

// GET expense by ID
router.get('/:id', expenseController.getExpenseById);

// POST create new expense
router.post('/', expenseController.createExpense);

// PUT update expense
router.put('/:id', expenseController.updateExpense);

// DELETE expense
router.delete('/:id', expenseController.deleteExpense);

export default router;

