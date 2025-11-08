-- Create database (run this as postgres superuser)
-- CREATE DATABASE alok_library;

-- Connect to alok_library database and run the following:

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  expiry_date DATE NOT NULL,
  profile_picture TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on expiry_date for faster queries
CREATE INDEX IF NOT EXISTS idx_students_expiry_date ON students(expiry_date);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at);

