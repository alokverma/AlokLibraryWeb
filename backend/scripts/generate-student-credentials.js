import pool from '../config/database.js';
import { generateStudentCredentials, setStudentCredentials } from '../utils/userUtils.js';
import dotenv from 'dotenv';

dotenv.config();

const generateCredentialsForStudent = async (studentName) => {
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
        console.log(`${index + 1}. ${student.name} (ID: ${student.id})`);
      });
      console.log('\nPlease be more specific with the name.');
      return;
    }

    const student = result.rows[0];

    if (student.username) {
      console.log(`⚠️  Student "${student.name}" already has credentials:`);
      console.log(`   Username: ${student.username}`);
      console.log(`   Note: Password is hashed and cannot be retrieved.`);
      console.log(`\n💡 If you need to reset the password, you'll need to create a password reset feature.`);
      return;
    }

    // Generate credentials
    const { username, password } = generateStudentCredentials(student.name, student.id);

    // Set credentials in database
    await setStudentCredentials(student.id, username, password);

    console.log(`✅ Credentials generated for "${student.name}":\n`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`\n⚠️  IMPORTANT: Save these credentials. The password cannot be retrieved again!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Get student name from command line argument
const studentName = process.argv[2];

if (!studentName) {
  console.log('Usage: node scripts/generate-student-credentials.js <student-name>');
  console.log('Example: node scripts/generate-student-credentials.js Rajesh');
  process.exit(1);
}

generateCredentialsForStudent(studentName);

