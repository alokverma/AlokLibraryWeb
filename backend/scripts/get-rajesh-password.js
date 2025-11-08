import pool from '../config/database.js';
import { generateStudentCredentials, setStudentCredentials } from '../utils/userUtils.js';

async function getOrResetRajeshPassword() {
  try {
    // Find Rajesh by name
    const result = await pool.query(
      'SELECT id, name, username FROM students WHERE LOWER(name) LIKE LOWER($1)',
      ['%rajesh%']
    );

    if (result.rows.length === 0) {
      console.log('❌ No student found with name containing "Rajesh"');
      return;
    }

    const student = result.rows[0];
    console.log(`\n📋 Found student: ${student.name} (ID: ${student.id})`);
    console.log(`   Current username: ${student.username || 'Not set'}`);

    // Generate new credentials
    const { username, password } = generateStudentCredentials(student.name, student.id);
    
    // Set the credentials in the database
    await setStudentCredentials(student.id, username, password);

    console.log(`\n✅ New credentials generated and set:`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`\n⚠️  Save this password now - it cannot be retrieved later!`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

getOrResetRajeshPassword();

