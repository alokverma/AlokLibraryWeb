import dotenv from 'dotenv';
import { updateUserPassword } from '../utils/userUtils.js';

dotenv.config();

const updatePasswords = async () => {
  try {
    console.log('🔄 Updating admin and teacher passwords...\n');
    
    // New complex passwords
    const adminPassword = 'Al0k@dmin2024!';
    const teacherPassword = 'T3ach@2024!';
    
    // Update admin password
    const adminResult = await updateUserPassword('admin', adminPassword);
    if (adminResult) {
      console.log('✅ Admin password updated successfully');
      console.log(`   Username: admin`);
      console.log(`   Password: ${adminPassword}\n`);
    } else {
      console.log('⚠️  Admin user not found (may not exist yet)\n');
    }
    
    // Update teacher password
    const teacherResult = await updateUserPassword('teacher', teacherPassword);
    if (teacherResult) {
      console.log('✅ Teacher password updated successfully');
      console.log(`   Username: teacher`);
      console.log(`   Password: ${teacherPassword}\n`);
    } else {
      console.log('⚠️  Teacher user not found (may not exist yet)\n');
    }
    
    console.log('✅ Password update complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    process.exit(1);
  }
};

updatePasswords();

