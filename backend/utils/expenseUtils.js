import pool from '../config/database.js';

// Get all expenses
export const getAllExpenses = async (filters = {}) => {
  try {
    let query = `
      SELECT id, title, description, amount::numeric as amount, type, category, expense_date::text as "expenseDate",
             created_by as "createdBy", created_at::text as "createdAt", updated_at::text as "updatedAt"
      FROM expenses
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (filters.type) {
      query += ` AND type = $${paramIndex}`;
      params.push(filters.type);
      paramIndex++;
    }

    if (filters.startDate) {
      query += ` AND expense_date >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    if (filters.endDate) {
      query += ` AND expense_date <= $${paramIndex}`;
      params.push(filters.endDate);
      paramIndex++;
    }

    query += ` ORDER BY expense_date DESC, created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching expenses:', error);
    throw error;
  }
};

// Get expense by ID
export const getExpenseById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT id, title, description, amount::numeric as amount, type, category, expense_date::text as "expenseDate",
              created_by as "createdBy", created_at::text as "createdAt", updated_at::text as "updatedAt"
       FROM expenses
       WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching expense:', error);
    throw error;
  }
};

// Create new expense
export const createExpense = async (expenseData) => {
  try {
    const { id, title, description, amount, type, category, expenseDate, createdBy } = expenseData;
    const result = await pool.query(
      `INSERT INTO expenses (id, title, description, amount, type, category, expense_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, title, description, amount::numeric as amount, type, category, expense_date::text as "expenseDate",
                 created_by as "createdBy", created_at::text as "createdAt", updated_at::text as "updatedAt"`,
      [id, title, description || null, amount, type, category || null, expenseDate, createdBy]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating expense:', error);
    throw error;
  }
};

// Update expense
export const updateExpense = async (id, expenseData) => {
  try {
    const { title, description, amount, type, category, expenseDate } = expenseData;
    const result = await pool.query(
      `UPDATE expenses
       SET title = $1, description = $2, amount = $3, type = $4, category = $5, expense_date = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, title, description, amount::numeric as amount, type, category, expense_date::text as "expenseDate",
                 created_by as "createdBy", created_at::text as "createdAt", updated_at::text as "updatedAt"`,
      [title, description || null, amount, type, category || null, expenseDate, id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating expense:', error);
    throw error;
  }
};

// Delete expense
export const deleteExpense = async (id) => {
  try {
    const result = await pool.query(
      `DELETE FROM expenses
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error deleting expense:', error);
    throw error;
  }
};

// Get monthly expenses statistics
export const getMonthlyExpenses = async () => {
  try {
    const result = await pool.query(
      `SELECT
         TO_CHAR(expense_date, 'YYYY-MM') as month,
         type,
         SUM(amount) as total
       FROM expenses
       WHERE expense_date >= NOW() - INTERVAL '12 months'
       GROUP BY TO_CHAR(expense_date, 'YYYY-MM'), type
       ORDER BY month ASC, type ASC`
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching monthly expenses:', error);
    throw error;
  }
};

