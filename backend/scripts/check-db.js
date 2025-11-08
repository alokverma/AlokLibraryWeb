import pool from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking database connection...\n');
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL database\n');
    
    // Get all students
    const result = await pool.query(
      'SELECT id, name, phone_number as "phoneNumber", start_date::text as "startDate", expiry_date::text as "expiryDate", profile_picture as "profilePicture", created_at as "createdAt", updated_at as "updatedAt" FROM students ORDER BY created_at DESC'
    );
    
    if (result.rows.length === 0) {
      console.log('📭 No students found in the database.\n');
      console.log('💡 The database is empty. Add students through the API or frontend.');
    } else {
      console.log(`📊 Found ${result.rows.length} student(s) in the database:\n`);
      console.log('─'.repeat(100));
      console.log(
        'ID'.padEnd(38) +
        'Name'.padEnd(25) +
        'Phone'.padEnd(18) +
        'Expiry Date'.padEnd(15) +
        'Status'
      );
      console.log('─'.repeat(100));
      
      result.rows.forEach((student) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiryDate = student.expiryDate || student.expiry_date || '';
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const status = expiry >= today ? '✅ Active' : '❌ Expired';
        
        console.log(
          (student.id || '').substring(0, 36).padEnd(38) +
          (student.name || '').substring(0, 23).padEnd(25) +
          (student.phoneNumber || student.phone_number || '').substring(0, 16).padEnd(18) +
          (expiryDate || '').padEnd(15) +
          status
        );
      });
      
      console.log('─'.repeat(100));
      console.log('\n📋 Detailed Information:\n');
      
      result.rows.forEach((student, index) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const expiry = new Date(student.expiryDate);
        expiry.setHours(0, 0, 0, 0);
        const status = expiry >= today ? 'Active' : 'Expired';
        
        console.log(`${index + 1}. ${student.name}`);
        console.log(`   ID: ${student.id}`);
        console.log(`   Phone: ${student.phoneNumber}`);
        console.log(`   Expiry Date: ${student.expiryDate}`);
        console.log(`   Status: ${status}`);
        console.log(`   Profile Picture: ${student.profilePicture || 'N/A'}`);
        console.log(`   Created: ${student.createdAt}`);
        console.log(`   Updated: ${student.updatedAt}`);
        console.log('');
      });
    }
    
    // Get statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN expiry_date >= CURRENT_DATE THEN 1 END) as active,
        COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired
      FROM students
    `);
    
    const stats = statsResult.rows[0];
    console.log('📈 Statistics:');
    console.log(`   Total Students: ${stats.total}`);
    console.log(`   Active Subscriptions: ${stats.active}`);
    console.log(`   Expired Subscriptions: ${stats.expired}`);
    
    client.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking database:', error.message);
    console.error('\n📋 Connection Details:');
    console.error(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.error(`   Port: ${process.env.DB_PORT || 5432}`);
    console.error(`   Database: ${process.env.DB_NAME || 'alok_library'}`);
    console.error(`   User: ${process.env.DB_USER || 'postgres'}`);
    console.error(`   Password: ${process.env.DB_PASSWORD ? '***' : '(empty)'}`);
    
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Install PostgreSQL:');
    console.error('      brew install postgresql@14');
    console.error('      brew services start postgresql@14');
    console.error('');
    console.error('   2. Create the database:');
    console.error('      createdb alok_library');
    console.error('');
    console.error('   3. Update .env file with correct credentials');
    console.error('');
    console.error('   4. Check if PostgreSQL is running:');
    console.error('      brew services list | grep postgres');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\n⚠️  Connection refused - PostgreSQL may not be running');
    } else if (error.code === 'ENOTFOUND') {
      console.error('\n⚠️  Host not found - Check DB_HOST in .env');
    } else if (error.code === '28P01') {
      console.error('\n⚠️  Authentication failed - Check DB_USER and DB_PASSWORD in .env');
    } else if (error.code === '3D000') {
      console.error('\n⚠️  Database does not exist - Create it with: createdb alok_library');
    }
    
    process.exit(1);
  }
};

checkDatabase();

