import pool from '../config/database.js';
import { hashPassword, comparePassword } from './auth.js';
import { v4 as uuidv4 } from 'uuid';

// Create admin/teacher user
export const createUser = async (username, password, role) => {
  try {
    const passwordHash = await hashPassword(password);
    const id = uuidv4();
    
    const result = await pool.query(
      'INSERT INTO users (id, username, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING RETURNING id, username, role',
      [id, username, passwordHash, role]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

// Find user by username
export const findUserByUsername = async (username) => {
  try {
    const result = await pool.query(
      'SELECT id, username, password_hash, role FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding user:', error);
    throw error;
  }
};

// Find student by username
export const findStudentByUsername = async (username) => {
  try {
    const result = await pool.query(
      'SELECT id, name, username, password_hash FROM students WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error finding student:', error);
    throw error;
  }
};

// Generate student credentials
export const generateStudentCredentials = (studentName, studentId) => {
  // Generate username: firstname_lastname_id (lowercase, no spaces)
  const nameParts = studentName.toLowerCase().trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const shortId = studentId.substring(0, 8);
  const username = `${firstName}${lastName ? '_' + lastName : ''}_${shortId}`.replace(/[^a-z0-9_]/g, '');
  
  // Generate password: random 8 character alphanumeric
  const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
  const passwordFinal = password.substring(0, 8);
  
  return { username, password: passwordFinal };
};

// Set student credentials
export const setStudentCredentials = async (studentId, username, password) => {
  try {
    const passwordHash = await hashPassword(password);
    
    const result = await pool.query(
      'UPDATE students SET username = $1, password_hash = $2 WHERE id = $3 RETURNING id, username',
      [username, passwordHash, studentId]
    );
    
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error setting student credentials:', error);
    throw error;
  }
};

// Verify student password
export const verifyStudentPassword = async (username, password) => {
  try {
    const student = await findStudentByUsername(username);
    if (!student) {
      return null;
    }
    
    const isValid = await comparePassword(password, student.password_hash);
    if (!isValid) {
      return null;
    }
    
    return {
      id: student.id,
      username: student.username,
      name: student.name,
      role: 'student',
    };
  } catch (error) {
    console.error('Error verifying student password:', error);
    throw error;
  }
};

// Initialize default admin and teacher accounts
export const initializeDefaultUsers = async () => {
  try {
    // Create admin user
    await createUser('admin', 'admin123', 'admin');
    console.log('✅ Admin user created (username: admin, password: admin123)');
    
    // Create teacher user
    await createUser('teacher', 'teacher123', 'teacher');
    console.log('✅ Teacher user created (username: teacher, password: teacher123)');
  } catch (error) {
    console.error('Error initializing default users:', error);
    // Don't throw, just log - users might already exist
  }
};

