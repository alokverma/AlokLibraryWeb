import pool from '../config/database.js';

// GET monthly statistics (registered users and earnings)
export const getMonthlyStatistics = async (req, res) => {
  try {
    const user = req.user;
    
    // Only admin can access analytics
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only admin can access analytics' });
    }

    // Get monthly registered users (based on created_at)
    const monthlyUsersQuery = `
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM') as month,
        COUNT(*) as count
      FROM students
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `;

    // Get monthly earnings (based on start_date, sum of actual payment_amount)
    // This accounts for different subscription durations (e.g., 2 months = 2 * monthly fee)
    const monthlyEarningsQuery = `
      SELECT 
        TO_CHAR(start_date, 'YYYY-MM') as month,
        COALESCE(SUM(payment_amount), 0) as earnings
      FROM students
      WHERE start_date >= NOW() - INTERVAL '12 months'
        AND payment_amount IS NOT NULL
      GROUP BY TO_CHAR(start_date, 'YYYY-MM')
      ORDER BY month ASC
    `;

    const [usersResult, earningsResult] = await Promise.all([
      pool.query(monthlyUsersQuery),
      pool.query(monthlyEarningsQuery)
    ]);

    // Format the data
    const monthlyUsers = usersResult.rows.map(row => ({
      month: row.month,
      count: parseInt(row.count)
    }));

    const monthlyEarnings = earningsResult.rows.map(row => ({
      month: row.month,
      earnings: parseFloat(row.earnings)
    }));

    res.json({
      monthlyUsers,
      monthlyEarnings,
    });
  } catch (error) {
    console.error('Error fetching monthly statistics:', error);
    res.status(500).json({ error: 'Failed to fetch monthly statistics', message: error.message });
  }
};

