import { v4 as uuidv4 } from 'uuid';
import * as expenseUtils from '../utils/expenseUtils.js';

// GET all expenses
export const getAllExpenses = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can access expenses
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can access expenses' });
    }

    const { type, startDate, endDate } = req.query;
    const filters = {};
    
    if (type) filters.type = type;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const expenses = await expenseUtils.getAllExpenses(filters);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses', message: error.message });
  }
};

// GET expense by ID
export const getExpenseById = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Only admin can access expenses
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can access expenses' });
    }

    const expense = await expenseUtils.getExpenseById(id);
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense', message: error.message });
  }
};

// POST create new expense
export const createExpense = async (req, res) => {
  try {
    const user = req.user;
    const { title, description, amount, type, category, expenseDate } = req.body;

    // Only admin can create expenses
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can create expenses' });
    }

    // Validation
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (amount === undefined || amount === null) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      return res.status(400).json({ error: 'Amount must be a positive number' });
    }

    if (!type || !['monthly', 'onetime'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "monthly" or "onetime"' });
    }

    if (!expenseDate) {
      return res.status(400).json({ error: 'Expense date is required' });
    }

    const expenseId = uuidv4();
    const expenseData = {
      id: expenseId,
      title: title.trim(),
      description: description ? description.trim() : null,
      amount: amountNum,
      type,
      category: category ? category.trim() : null,
      expenseDate,
      createdBy: user.id,
    };

    const newExpense = await expenseUtils.createExpense(expenseData);
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense', message: error.message });
  }
};

// PUT update expense
export const updateExpense = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { title, description, amount, type, category, expenseDate } = req.body;

    // Only admin can update expenses
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can update expenses' });
    }

    // Validation
    if (title !== undefined && !title.trim()) {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    if (amount !== undefined) {
      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum < 0) {
        return res.status(400).json({ error: 'Amount must be a positive number' });
      }
    }

    if (type && !['monthly', 'onetime'].includes(type)) {
      return res.status(400).json({ error: 'Type must be either "monthly" or "onetime"' });
    }

    const expenseData = {
      title: title ? title.trim() : undefined,
      description: description !== undefined ? (description ? description.trim() : null) : undefined,
      amount: amount !== undefined ? parseFloat(amount) : undefined,
      type: type || undefined,
      category: category !== undefined ? (category ? category.trim() : null) : undefined,
      expenseDate: expenseDate || undefined,
    };

    // Remove undefined fields
    Object.keys(expenseData).forEach(key => {
      if (expenseData[key] === undefined) {
        delete expenseData[key];
      }
    });

    const updatedExpense = await expenseUtils.updateExpense(id, expenseData);
    if (!updatedExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(updatedExpense);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense', message: error.message });
  }
};

// DELETE expense
export const deleteExpense = async (req, res) => {
  try {
    const user = req.user;
    const { id } = req.params;

    // Only admin can delete expenses
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can delete expenses' });
    }

    const deletedExpense = await expenseUtils.deleteExpense(id);
    if (!deletedExpense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense', message: error.message });
  }
};

// GET monthly expenses statistics
export const getMonthlyExpenses = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can access expense statistics
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can access expense statistics' });
    }

    const monthlyExpenses = await expenseUtils.getMonthlyExpenses();
    res.json(monthlyExpenses);
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    res.status(500).json({ error: 'Failed to fetch monthly expenses', message: error.message });
  }
};

