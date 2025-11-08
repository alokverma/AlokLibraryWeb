import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// Get all notifications
export const getAllNotifications = async (activeOnly = false) => {
  try {
    let query;
    if (activeOnly) {
      query = `
        SELECT id, title, message, type, created_by as "createdBy", is_active as "isActive", 
               created_at::text as "createdAt", updated_at::text as "updatedAt"
        FROM notifications
        WHERE is_active = true
        ORDER BY created_at DESC
      `;
    } else {
      query = `
        SELECT id, title, message, type, created_by as "createdBy", is_active as "isActive", 
               created_at::text as "createdAt", updated_at::text as "updatedAt"
        FROM notifications
        ORDER BY created_at DESC
      `;
    }
    const result = await pool.query(query);
    return result.rows;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
};

// Get notification by ID
export const getNotificationById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT id, title, message, type, created_by as "createdBy", is_active as "isActive", 
              created_at::text as "createdAt", updated_at::text as "updatedAt"
       FROM notifications WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }
};

// Create notification
export const createNotification = async (notificationData) => {
  try {
    const { title, message, type, createdBy } = notificationData;
    const id = uuidv4();
    
    const result = await pool.query(
      `INSERT INTO notifications (id, title, message, type, created_by, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, title, message, type, created_by as "createdBy", is_active as "isActive", 
                 created_at::text as "createdAt", updated_at::text as "updatedAt"`,
      [id, title, message, type, createdBy]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Update notification
export const updateNotification = async (id, notificationData) => {
  try {
    const { title, message, type, isActive } = notificationData;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramCount++}`);
      values.push(title);
    }
    if (message !== undefined) {
      updates.push(`message = $${paramCount++}`);
      values.push(message);
    }
    if (type !== undefined) {
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(isActive);
    }

    if (updates.length === 0) {
      return await getNotificationById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE notifications SET ${updates.join(', ')} WHERE id = $${paramCount}
       RETURNING id, title, message, type, created_by as "createdBy", is_active as "isActive", 
                 created_at::text as "createdAt", updated_at::text as "updatedAt"`,
      values
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating notification:', error);
    throw error;
  }
};

// Delete notification
export const deleteNotification = async (id) => {
  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE id = $1 RETURNING id',
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

