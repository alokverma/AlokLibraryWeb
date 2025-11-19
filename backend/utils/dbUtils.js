import pool from '../config/database.js';

// Determine subscription status based on expiry date
export const determineSubscriptionStatus = (expiryDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  return expiry >= today ? 'active' : 'expired';
};

// Initialize database - create table if it doesn't exist
export const initializeDatabase = async () => {
  try {
    // Create students table
    const createStudentsTable = `
      CREATE TABLE IF NOT EXISTS students (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        aadhar_card VARCHAR(12) NOT NULL,
        start_date DATE NOT NULL,
        expiry_date DATE NOT NULL,
        subscription_months INTEGER DEFAULT 1,
        payment_amount DECIMAL(10, 2) NOT NULL,
        is_payment_done BOOLEAN DEFAULT false,
        profile_picture TEXT,
        username VARCHAR(100) UNIQUE,
        password_hash TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createStudentsTable);
    
    // Create users table for admin and teacher
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createUsersTable);
    
    // Create notifications table
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) NOT NULL CHECK (type IN ('exam', 'event', 'library', 'motivation', 'form', 'general')),
        created_by VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;

    await pool.query(createNotificationsTable);
    
    // Create FCM tokens table for storing student push notification tokens
    const createFCMTokensTable = `
      CREATE TABLE IF NOT EXISTS student_fcm_tokens (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::text,
        student_id VARCHAR(255) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        fcm_token TEXT NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(student_id, fcm_token)
      );
      CREATE INDEX IF NOT EXISTS idx_student_fcm_tokens_student_id ON student_fcm_tokens(student_id);
      CREATE INDEX IF NOT EXISTS idx_student_fcm_tokens_active ON student_fcm_tokens(is_active) WHERE is_active = true;
    `;

    await pool.query(createFCMTokensTable);
    
    // Ensure is_active column has correct default and update existing notifications if needed
    try {
      // Check if is_active column exists and update default if needed
      await pool.query(`
        DO $$ 
        BEGIN
          -- Update default value if column exists
          IF EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_name = 'notifications' AND column_name = 'is_active') THEN
            ALTER TABLE notifications ALTER COLUMN is_active SET DEFAULT true;
            -- Set any NULL values to true
            UPDATE notifications SET is_active = true WHERE is_active IS NULL;
          END IF;
        END $$;
      `);
    } catch (alterError) {
      // Column might not exist yet or already has correct default, ignore
      console.log('Note: is_active column default check completed');
    }
    
    // Add start_date column if it doesn't exist (for existing databases)
    try {
      await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS start_date DATE;');
      // Update existing rows to have start_date = expiry_date - 1 month if start_date is null
      await pool.query(`
        UPDATE students 
        SET start_date = expiry_date - INTERVAL '1 month' 
        WHERE start_date IS NULL;
      `);
    } catch (alterError) {
      // Column might already exist, ignore
    }

    // Add username and password_hash columns to students if they don't exist
    try {
      await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS username VARCHAR(100);');
      await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS password_hash TEXT;');
      await pool.query('CREATE UNIQUE INDEX IF NOT EXISTS students_username_idx ON students(username) WHERE username IS NOT NULL;');
    } catch (alterError) {
      // Columns might already exist, ignore
    }

    // Add new columns for address, aadhar_card, and payment_amount if they don't exist
    try {
      await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;');
      await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS aadhar_card VARCHAR(12);');
      await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2);');
      await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS subscription_months INTEGER DEFAULT 1;');
      await pool.query('ALTER TABLE students ADD COLUMN IF NOT EXISTS is_payment_done BOOLEAN DEFAULT false;');
      // Update existing rows to have default values if they are NULL
      await pool.query(`UPDATE students SET address = 'Not provided' WHERE address IS NULL;`);
      await pool.query(`UPDATE students SET aadhar_card = '000000000000' WHERE aadhar_card IS NULL;`);
      await pool.query(`UPDATE students SET payment_amount = 0 WHERE payment_amount IS NULL;`);
      await pool.query(`UPDATE students SET subscription_months = 1 WHERE subscription_months IS NULL;`);
      await pool.query(`UPDATE students SET is_payment_done = false WHERE is_payment_done IS NULL;`);
    } catch (alterError) {
      // Columns might already exist, ignore
    }

    // Create student_notes table
    const createStudentNotesTable = `
      CREATE TABLE IF NOT EXISTS student_notes (
        id VARCHAR(255) PRIMARY KEY,
        student_id VARCHAR(255) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createStudentNotesTable);
    
    // Create index on student_id for faster queries
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS student_notes_student_id_idx ON student_notes(student_id);');
    } catch (indexError) {
      // Index might already exist, ignore
    }

    // Create expenses table
    const createExpensesTable = `
      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        amount DECIMAL(10, 2) NOT NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('monthly', 'onetime')),
        category VARCHAR(100),
        expense_date DATE NOT NULL,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createExpensesTable);
    
    // Create index on expense_date and type for faster queries
    try {
      await pool.query('CREATE INDEX IF NOT EXISTS expenses_date_idx ON expenses(expense_date);');
      await pool.query('CREATE INDEX IF NOT EXISTS expenses_type_idx ON expenses(type);');
    } catch (indexError) {
      // Index might already exist, ignore
    }
    
    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  }
};

// Get all students
export const getAllStudents = async (studentId = null) => {
  try {
    let query;
    let params;
    
    if (studentId) {
      // Get only specific student
      query = `SELECT id, name, phone_number as "phoneNumber", address, aadhar_card as "aadharCard", 
               start_date::text as "startDate", expiry_date::text as "expiryDate", 
               subscription_months as "subscriptionMonths", payment_amount as "paymentAmount", 
               is_payment_done as "isPaymentDone", profile_picture as "profilePicture" 
               FROM students WHERE id = $1 ORDER BY created_at DESC`;
      params = [studentId];
    } else {
      // Get all students
      query = `SELECT id, name, phone_number as "phoneNumber", address, aadhar_card as "aadharCard", 
               start_date::text as "startDate", expiry_date::text as "expiryDate", 
               subscription_months as "subscriptionMonths", payment_amount as "paymentAmount", 
               is_payment_done as "isPaymentDone", profile_picture as "profilePicture" 
               FROM students ORDER BY created_at DESC`;
      params = [];
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Error fetching students:', error);
    throw error;
  }
};

// Get student by ID
export const getStudentById = async (id) => {
  try {
    const result = await pool.query(
      `SELECT id, name, phone_number as "phoneNumber", address, aadhar_card as "aadharCard", 
       start_date::text as "startDate", expiry_date::text as "expiryDate", 
       subscription_months as "subscriptionMonths", payment_amount as "paymentAmount", 
       is_payment_done as "isPaymentDone", profile_picture as "profilePicture" 
       FROM students WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching student:', error);
    throw error;
  }
};

// Create new student
export const createStudent = async (studentData) => {
  try {
    const { id, name, phoneNumber, address, aadharCard, startDate, expiryDate, subscriptionMonths, paymentAmount, isPaymentDone, profilePicture } = studentData;
    const result = await pool.query(
      `INSERT INTO students (id, name, phone_number, address, aadhar_card, start_date, expiry_date, subscription_months, payment_amount, is_payment_done, profile_picture) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
       RETURNING id, name, phone_number as "phoneNumber", address, aadhar_card as "aadharCard", 
       start_date::text as "startDate", expiry_date::text as "expiryDate", 
       subscription_months as "subscriptionMonths", payment_amount as "paymentAmount", 
       is_payment_done as "isPaymentDone", profile_picture as "profilePicture"`,
      [id, name, phoneNumber, address, aadharCard, startDate, expiryDate, subscriptionMonths || 1, paymentAmount, isPaymentDone || false, profilePicture]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating student:', error);
    throw error;
  }
};

// Update student
export const updateStudent = async (id, studentData) => {
  try {
    const { name, phoneNumber, address, aadharCard, startDate, expiryDate, subscriptionMonths, paymentAmount, isPaymentDone, profilePicture } = studentData;
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (phoneNumber !== undefined) {
      updates.push(`phone_number = $${paramCount++}`);
      values.push(phoneNumber);
    }
    if (address !== undefined) {
      updates.push(`address = $${paramCount++}`);
      values.push(address);
    }
    if (aadharCard !== undefined) {
      updates.push(`aadhar_card = $${paramCount++}`);
      values.push(aadharCard);
    }
    if (startDate !== undefined) {
      updates.push(`start_date = $${paramCount++}`);
      values.push(startDate);
    }
    if (expiryDate !== undefined) {
      updates.push(`expiry_date = $${paramCount++}`);
      values.push(expiryDate);
    }
    if (subscriptionMonths !== undefined) {
      updates.push(`subscription_months = $${paramCount++}`);
      values.push(subscriptionMonths);
    }
    if (paymentAmount !== undefined) {
      updates.push(`payment_amount = $${paramCount++}`);
      values.push(paymentAmount);
    }
    if (isPaymentDone !== undefined) {
      updates.push(`is_payment_done = $${paramCount++}`);
      values.push(isPaymentDone);
    }
    if (profilePicture !== undefined) {
      updates.push(`profile_picture = $${paramCount++}`);
      values.push(profilePicture);
    }

    if (updates.length === 0) {
      // No updates provided, just return the existing student
      return await getStudentById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE students SET ${updates.join(', ')} WHERE id = $${paramCount} 
       RETURNING id, name, phone_number as "phoneNumber", address, aadhar_card as "aadharCard", 
       start_date::text as "startDate", expiry_date::text as "expiryDate", 
       subscription_months as "subscriptionMonths", payment_amount as "paymentAmount", 
       is_payment_done as "isPaymentDone", profile_picture as "profilePicture"`,
      values
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating student:', error);
    throw error;
  }
};

// Delete student
export const deleteStudent = async (id) => {
  try {
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING id', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error deleting student:', error);
    throw error;
  }
};

