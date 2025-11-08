import pool from '../config/database.js';

// Get all notes for a student
export const getAllNotes = async (studentId) => {
  try {
    const result = await pool.query(
      `SELECT id, title, content, created_at::text as "createdAt", updated_at::text as "updatedAt"
       FROM student_notes
       WHERE student_id = $1
       ORDER BY updated_at DESC`,
      [studentId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }
};

// Get note by ID
export const getNoteById = async (id, studentId) => {
  try {
    const result = await pool.query(
      `SELECT id, title, content, created_at::text as "createdAt", updated_at::text as "updatedAt"
       FROM student_notes
       WHERE id = $1 AND student_id = $2`,
      [id, studentId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching note:', error);
    throw error;
  }
};

// Create new note
export const createNote = async (noteData) => {
  try {
    const { id, studentId, title, content } = noteData;
    const result = await pool.query(
      `INSERT INTO student_notes (id, student_id, title, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, content, created_at::text as "createdAt", updated_at::text as "updatedAt"`,
      [id, studentId, title, content]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
};

// Update note
export const updateNote = async (id, studentId, noteData) => {
  try {
    const { title, content } = noteData;
    const result = await pool.query(
      `UPDATE student_notes
       SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND student_id = $4
       RETURNING id, title, content, created_at::text as "createdAt", updated_at::text as "updatedAt"`,
      [title, content, id, studentId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

// Delete note
export const deleteNote = async (id, studentId) => {
  try {
    const result = await pool.query(
      `DELETE FROM student_notes
       WHERE id = $1 AND student_id = $2
       RETURNING id`,
      [id, studentId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

