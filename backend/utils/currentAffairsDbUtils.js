import pool from '../config/database.js';

/**
 * Database utilities for current affairs storage
 */

/**
 * Get current affairs for today from database
 */
export async function getCurrentAffairsFromDB(date) {
  try {
    const result = await pool.query(
      'SELECT data FROM current_affairs WHERE date = $1',
      [date]
    );
    
    if (result.rows.length > 0) {
      return result.rows[0].data;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current affairs from DB:', error);
    return null;
  }
}

/**
 * Save current affairs to database
 */
export async function saveCurrentAffairsToDB(date, data) {
  try {
    await pool.query(
      `INSERT INTO current_affairs (date, data, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (date) 
       DO UPDATE SET data = $2, updated_at = CURRENT_TIMESTAMP`,
      [date, JSON.stringify(data)]
    );
    console.log(`✅ Current affairs saved to database for date: ${date}`);
    return true;
  } catch (error) {
    console.error('Error saving current affairs to DB:', error);
    return false;
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

