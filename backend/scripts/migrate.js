import pool from '../config/database.js';
import { initializeDatabase } from '../utils/dbUtils.js';
import dotenv from 'dotenv';

dotenv.config();

// Migration script to set up the database
const migrate = async () => {
  try {
    console.log('🔄 Running database migration...');
    await initializeDatabase();
    console.log('✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrate();

