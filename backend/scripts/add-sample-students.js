import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const sampleStudents = [
  // 10 Active students (expiry date in future)
  { name: 'Rajesh Kumar', phone: '+91 98765 43210', daysFromNow: 15 },
  { name: 'Priya Sharma', phone: '+91 98765 43211', daysFromNow: 20 },
  { name: 'Amit Singh', phone: '+91 98765 43212', daysFromNow: 25 },
  { name: 'Sneha Patel', phone: '+91 98765 43213', daysFromNow: 30 },
  { name: 'Vikram Mehta', phone: '+91 98765 43214', daysFromNow: 10 },
  { name: 'Anjali Desai', phone: '+91 98765 43215', daysFromNow: 45 },
  { name: 'Rohit Gupta', phone: '+91 98765 43216', daysFromNow: 60 },
  { name: 'Kavita Reddy', phone: '+91 98765 43217', daysFromNow: 5 },
  { name: 'Arjun Nair', phone: '+91 98765 43218', daysFromNow: 35 },
  { name: 'Meera Iyer', phone: '+91 98765 43219', daysFromNow: 50 },
  
  // 5 Expired students (expiry date in past)
  { name: 'Suresh Kumar', phone: '+91 98765 43220', daysFromNow: -5 },
  { name: 'Lakshmi Devi', phone: '+91 98765 43221', daysFromNow: -10 },
  { name: 'Mohan Das', phone: '+91 98765 43222', daysFromNow: -15 },
  { name: 'Radha Menon', phone: '+91 98765 43223', daysFromNow: -20 },
  { name: 'Gopal Joshi', phone: '+91 98765 43224', daysFromNow: -30 },
];

const addSampleStudents = async () => {
  try {
    console.log('🔄 Adding sample students to database...\n');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const student of sampleStudents) {
      // Calculate start date (1 month before expiry)
      const expiryDate = new Date(today);
      expiryDate.setDate(expiryDate.getDate() + student.daysFromNow);
      
      const startDate = new Date(expiryDate);
      startDate.setMonth(startDate.getMonth() - 1);

      const id = uuidv4();
      const name = student.name;
      const phoneNumber = student.phone;
      const startDateStr = startDate.toISOString().split('T')[0];
      const expiryDateStr = expiryDate.toISOString().split('T')[0];
      const profilePicture = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;

      await pool.query(
        'INSERT INTO students (id, name, phone_number, start_date, expiry_date, profile_picture) VALUES ($1, $2, $3, $4, $5, $6)',
        [id, name, phoneNumber, startDateStr, expiryDateStr, profilePicture]
      );

      const status = expiryDate >= today ? '✅ Active' : '❌ Expired';
      console.log(`${status} - ${name} (Expires: ${expiryDateStr})`);
    }

    console.log('\n✅ Successfully added all sample students!');
    
    // Show summary
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN expiry_date >= CURRENT_DATE THEN 1 END) as active,
        COUNT(CASE WHEN expiry_date < CURRENT_DATE THEN 1 END) as expired
      FROM students
    `);
    
    const stats = result.rows[0];
    console.log('\n📊 Database Summary:');
    console.log(`   Total Students: ${stats.total}`);
    console.log(`   Active Subscriptions: ${stats.active}`);
    console.log(`   Expired Subscriptions: ${stats.expired}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample students:', error);
    process.exit(1);
  }
};

addSampleStudents();

