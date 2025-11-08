import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcrypt';

const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Dummy student data
const dummyStudents = [
  // 1 month subscriptions (₹500)
  { name: 'Rajesh Kumar', phoneNumber: '+91 98765 43210', address: '123 Main Street, New Delhi', aadharCard: '123456789012', subscriptionMonths: 1, paymentAmount: 500, isPaymentDone: true },
  { name: 'Priya Sharma', phoneNumber: '+91 98765 43211', address: '456 Park Avenue, Mumbai', aadharCard: '123456789013', subscriptionMonths: 1, paymentAmount: 500, isPaymentDone: true },
  { name: 'Amit Patel', phoneNumber: '+91 98765 43212', address: '789 Gandhi Road, Bangalore', aadharCard: '123456789014', subscriptionMonths: 1, paymentAmount: 500, isPaymentDone: false },
  { name: 'Sneha Reddy', phoneNumber: '+91 98765 43213', address: '321 MG Road, Hyderabad', aadharCard: '123456789015', subscriptionMonths: 1, paymentAmount: 500, isPaymentDone: true },
  { name: 'Vikram Singh', phoneNumber: '+91 98765 43214', address: '654 Nehru Street, Chennai', aadharCard: '123456789016', subscriptionMonths: 1, paymentAmount: 500, isPaymentDone: true },
  { name: 'Anjali Mehta', phoneNumber: '+91 98765 43215', address: '987 Indira Nagar, Pune', aadharCard: '123456789017', subscriptionMonths: 1, paymentAmount: 500, isPaymentDone: false },
  { name: 'Rahul Verma', phoneNumber: '+91 98765 43216', address: '147 Sector 5, Noida', aadharCard: '123456789018', subscriptionMonths: 1, paymentAmount: 500, isPaymentDone: true },
  { name: 'Kavita Joshi', phoneNumber: '+91 98765 43217', address: '258 Ring Road, Jaipur', aadharCard: '123456789019', subscriptionMonths: 1, paymentAmount: 500, isPaymentDone: true },
  { name: 'Mohit Agarwal', phoneNumber: '+91 98765 43218', address: '369 Mall Road, Chandigarh', aadharCard: '123456789020', subscriptionMonths: 1, paymentAmount: 500, isPaymentDone: false },
  { name: 'Divya Nair', phoneNumber: '+91 98765 43219', address: '741 Beach Road, Kochi', aadharCard: '123456789021', subscriptionMonths: 1, paymentAmount: 500, isPaymentDone: true },
  
  // 2 month subscriptions (₹1000)
  { name: 'Arjun Malhotra', phoneNumber: '+91 98765 43220', address: '852 Connaught Place, New Delhi', aadharCard: '123456789022', subscriptionMonths: 2, paymentAmount: 1000, isPaymentDone: true },
  { name: 'Pooja Desai', phoneNumber: '+91 98765 43221', address: '963 Marine Drive, Mumbai', aadharCard: '123456789023', subscriptionMonths: 2, paymentAmount: 1000, isPaymentDone: true },
  { name: 'Rohit Iyer', phoneNumber: '+91 98765 43222', address: '159 Brigade Road, Bangalore', aadharCard: '123456789024', subscriptionMonths: 2, paymentAmount: 1000, isPaymentDone: false },
  { name: 'Meera Krishnan', phoneNumber: '+91 98765 43223', address: '357 Banjara Hills, Hyderabad', aadharCard: '123456789025', subscriptionMonths: 2, paymentAmount: 1000, isPaymentDone: true },
  { name: 'Siddharth Rao', phoneNumber: '+91 98765 43224', address: '468 T Nagar, Chennai', aadharCard: '123456789026', subscriptionMonths: 2, paymentAmount: 1000, isPaymentDone: true },
  { name: 'Neha Kapoor', phoneNumber: '+91 98765 43225', address: '579 Koregaon Park, Pune', aadharCard: '123456789027', subscriptionMonths: 2, paymentAmount: 1000, isPaymentDone: false },
  { name: 'Karan Thakur', phoneNumber: '+91 98765 43226', address: '680 Sector 18, Noida', aadharCard: '123456789028', subscriptionMonths: 2, paymentAmount: 1000, isPaymentDone: true },
  { name: 'Shreya Bansal', phoneNumber: '+91 98765 43227', address: '791 C Scheme, Jaipur', aadharCard: '123456789029', subscriptionMonths: 2, paymentAmount: 1000, isPaymentDone: true },
  { name: 'Aditya Chawla', phoneNumber: '+91 98765 43228', address: '802 Sector 17, Chandigarh', aadharCard: '123456789030', subscriptionMonths: 2, paymentAmount: 1000, isPaymentDone: false },
  { name: 'Nisha Menon', phoneNumber: '+91 98765 43229', address: '913 MG Road, Kochi', aadharCard: '123456789031', subscriptionMonths: 2, paymentAmount: 1000, isPaymentDone: true },
];

const generateUsername = (name, id) => {
  const nameParts = name.toLowerCase().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];
  const randomNum = id.substring(0, 4);
  return `${firstName}${lastName}${randomNum}`;
};

const generatePassword = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

const calculateExpiryDate = (startDate, months) => {
  const start = new Date(startDate);
  start.setMonth(start.getMonth() + months);
  return start.toISOString().split('T')[0];
};

const resetStudents = async () => {
  try {
    console.log('🗑️  Deleting all existing students...');
    
    // Delete all students
    await pool.query('DELETE FROM students');
    
    console.log('✅ All students deleted successfully');
    
    console.log('📝 Adding 20 dummy students...');
    
    // Get current date and create varied start dates (some in past months)
    const today = new Date();
    const studentsToInsert = [];
    
    for (let i = 0; i < dummyStudents.length; i++) {
      const student = dummyStudents[i];
      const studentId = uuidv4();
      const username = generateUsername(student.name, studentId);
      const password = generatePassword();
      const passwordHash = await hashPassword(password);
      
      // Create varied start dates - some in current month, some in past months
      const monthsAgo = Math.floor(i / 5); // Distribute across months
      const startDate = new Date(today);
      startDate.setMonth(startDate.getMonth() - monthsAgo);
      startDate.setDate(Math.floor(Math.random() * 28) + 1); // Random day in month
      const startDateStr = startDate.toISOString().split('T')[0];
      
      const expiryDate = calculateExpiryDate(startDateStr, student.subscriptionMonths);
      
      studentsToInsert.push({
        id: studentId,
        name: student.name,
        phoneNumber: student.phoneNumber,
        address: student.address,
        aadharCard: student.aadharCard,
        startDate: startDateStr,
        expiryDate: expiryDate,
        subscriptionMonths: student.subscriptionMonths,
        paymentAmount: student.paymentAmount,
        isPaymentDone: student.isPaymentDone,
        username: username,
        passwordHash: passwordHash,
        profilePicture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(student.name)}`,
      });
    }
    
    // Insert all students
    for (const student of studentsToInsert) {
      await pool.query(
        `INSERT INTO students (
          id, name, phone_number, address, aadhar_card, 
          start_date, expiry_date, subscription_months, 
          payment_amount, is_payment_done, username, password_hash, profile_picture
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          student.id,
          student.name,
          student.phoneNumber,
          student.address,
          student.aadharCard,
          student.startDate,
          student.expiryDate,
          student.subscriptionMonths,
          student.paymentAmount,
          student.isPaymentDone,
          student.username,
          student.passwordHash,
          student.profilePicture,
        ]
      );
    }
    
    console.log('✅ Successfully added 20 dummy students');
    console.log('\n📊 Summary:');
    console.log(`   - 1 month subscriptions: 10 students (₹500 each)`);
    console.log(`   - 2 month subscriptions: 10 students (₹1000 each)`);
    console.log(`   - Total payment amount: ₹${studentsToInsert.reduce((sum, s) => sum + s.paymentAmount, 0)}`);
    console.log(`   - Payment done: ${studentsToInsert.filter(s => s.isPaymentDone).length} students`);
    console.log(`   - Payment pending: ${studentsToInsert.filter(s => !s.isPaymentDone).length} students`);
    
    // Display credentials for first 5 students
    console.log('\n🔑 Sample Credentials (first 5 students):');
    for (let i = 0; i < Math.min(5, studentsToInsert.length); i++) {
      const s = studentsToInsert[i];
      const password = dummyStudents[i].name; // We don't have the original password, but we can show username
      console.log(`   ${i + 1}. ${s.name}`);
      console.log(`      Username: ${s.username}`);
      console.log(`      Password: (hashed in database)`);
    }
    
  } catch (error) {
    console.error('❌ Error resetting students:', error);
    throw error;
  } finally {
    await pool.end();
  }
};

// Run the script
resetStudents()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

