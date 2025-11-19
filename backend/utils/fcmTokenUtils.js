import pool from '../config/database.js';

/**
 * Get FCM token for a specific student
 * @param {string} studentId - Student ID
 * @returns {Promise<string|null>} FCM token or null
 */
export const getFCMTokenForStudent = async (studentId) => {
  try {
    const result = await pool.query(
      'SELECT fcm_token FROM student_fcm_tokens WHERE student_id = $1 AND is_active = true',
      [studentId]
    );
    return result.rows[0]?.fcm_token || null;
  } catch (error) {
    console.error('Error fetching FCM token:', error);
    throw error;
  }
};

/**
 * Get all active FCM tokens for all students
 * @returns {Promise<string[]>} Array of FCM tokens
 */
export const getFCMTokensForAllStudents = async () => {
  try {
    const result = await pool.query(
      'SELECT fcm_token FROM student_fcm_tokens WHERE is_active = true AND fcm_token IS NOT NULL'
    );
    return result.rows.map(row => row.fcm_token).filter(Boolean);
  } catch (error) {
    console.error('Error fetching FCM tokens:', error);
    throw error;
  }
};

/**
 * Register or update FCM token for a student
 * @param {string} studentId - Student ID
 * @param {string} fcmToken - FCM token
 * @returns {Promise<Object>} Result object
 */
export const registerFCMToken = async (studentId, fcmToken) => {
  try {
    if (!fcmToken || !studentId) {
      throw new Error('Student ID and FCM token are required');
    }

    // Check if token already exists for this student
    const existing = await pool.query(
      'SELECT id FROM student_fcm_tokens WHERE student_id = $1 AND fcm_token = $2',
      [studentId, fcmToken]
    );

    if (existing.rows.length > 0) {
      // Update existing token to active
      await pool.query(
        'UPDATE student_fcm_tokens SET is_active = true, updated_at = CURRENT_TIMESTAMP WHERE student_id = $1 AND fcm_token = $2',
        [studentId, fcmToken]
      );
      return { success: true, message: 'Token updated' };
    }

    // Deactivate old tokens for this student
    await pool.query(
      'UPDATE student_fcm_tokens SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE student_id = $1',
      [studentId]
    );

    // Insert new token
    await pool.query(
      `INSERT INTO student_fcm_tokens (student_id, fcm_token, is_active)
       VALUES ($1, $2, true)
       ON CONFLICT (student_id, fcm_token) 
       DO UPDATE SET is_active = true, updated_at = CURRENT_TIMESTAMP`,
      [studentId, fcmToken]
    );

    return { success: true, message: 'Token registered successfully' };
  } catch (error) {
    console.error('Error registering FCM token:', error);
    throw error;
  }
};

/**
 * Remove FCM token (mark as inactive)
 * @param {string} studentId - Student ID
 * @param {string} fcmToken - FCM token to remove
 * @returns {Promise<Object>} Result object
 */
export const removeFCMToken = async (studentId, fcmToken) => {
  try {
    await pool.query(
      'UPDATE student_fcm_tokens SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE student_id = $1 AND fcm_token = $2',
      [studentId, fcmToken]
    );
    return { success: true, message: 'Token removed successfully' };
  } catch (error) {
    console.error('Error removing FCM token:', error);
    throw error;
  }
};

/**
 * Remove invalid FCM tokens
 * @param {string[]} tokens - Array of invalid tokens
 * @returns {Promise<Object>} Result object
 */
export const removeInvalidTokens = async (tokens) => {
  try {
    if (!tokens || tokens.length === 0) {
      return { success: true, message: 'No tokens to remove' };
    }

    await pool.query(
      'UPDATE student_fcm_tokens SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE fcm_token = ANY($1)',
      [tokens]
    );
    return { success: true, message: 'Invalid tokens removed' };
  } catch (error) {
    console.error('Error removing invalid tokens:', error);
    throw error;
  }
};

