import pool from '../config/database.js';
import { generateStudentCredentials, setStudentCredentials } from '../utils/userUtils.js';
import dotenv from 'dotenv';

dotenv.config();

const resetPasswordForStudent = async (studentName) => {
  try {
    console.log(`🔍 Looking for student: ${studentName}...\n`);

    // Find student by name
    const result = await pool.query(
      'SELECT id, name, username FROM students WHERE name ILIKE $1',
      [`%${studentName}%`]
    );

    if (result.rows.length === 0) {
      console.log(`❌ No student found with name containing "${studentName}"`);
      return;
    }

    if (result.rows.length > 1) {
      console.log(`⚠️  Found ${result.rows.length} students matching "${studentName}":\n`);
      result.rows.forEach((student, index) => {
        console.log(`${index + 1}. ${student.name} (ID: ${student.id}, Username: ${student.username || 'Not set'})`);
      });
      console.log('\n💡 Please use the full name or ID to be more specific.');
      return;
    }

    const student = result.rows[0];

    // Generate new password (keep existing username or generate new one)
    let username = student.username;
    if (!username) {
      const credentials = generateStudentCredentials(student.name, student.id);
      username = credentials.username;
    }

    // Generate new password
    const password = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();
    const passwordFinal = password.substring(0, 8);

    // Set/update credentials in database
    await setStudentCredentials(student.id, username, passwordFinal);

    console.log(`✅ Password reset for "${student.name}":\n`);
    console.log(`   Username: ${username}`);
    console.log(`   New Password: ${passwordFinal}`);
    console.log(`\n⚠️  IMPORTANT: Save this password. It cannot be retrieved again!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Get student name from command line argument
const studentName = process.argv[2];

if (!studentName) {
  console.log('Usage: node scripts/reset-student-password.js <student-name>');
  console.log('Example: node scripts/reset-student-password.js "Rajesh Kumar"');
  process.exit(1);
}

resetPasswordForStudent(studentName);

