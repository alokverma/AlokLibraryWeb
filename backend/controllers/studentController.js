import { v4 as uuidv4 } from 'uuid';
import {
  getAllStudents as dbGetAllStudents,
  getStudentById as dbGetStudentById,
  createStudent as dbCreateStudent,
  updateStudent as dbUpdateStudent,
  deleteStudent as dbDeleteStudent,
  determineSubscriptionStatus,
} from '../utils/dbUtils.js';
import { generateStudentCredentials, setStudentCredentials } from '../utils/userUtils.js';

// GET all students
export const getAllStudents = async (req, res) => {
  try {
    // Get user from authenticated request
    const user = req.user;
    
    let students;
    
    // If user is a student, only return their own data
    if (user.role === 'student') {
      students = await dbGetAllStudents(user.id);
    } else {
      // Admin and teacher can see all students
      students = await dbGetAllStudents();
    }
    
    // Add subscription status based on expiry date
    const studentsWithStatus = students.map((student) => ({
      ...student,
      subscriptionStatus: determineSubscriptionStatus(student.expiryDate),
    }));
    res.json(studentsWithStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students', message: error.message });
  }
};

// GET student by ID
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    
    // If user is a student, they can only access their own data
    if (user.role === 'student' && user.id !== id) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own data' });
    }
    
    const student = await dbGetStudentById(id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const studentWithStatus = {
      ...student,
      subscriptionStatus: determineSubscriptionStatus(student.expiryDate),
    };

    res.json(studentWithStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student', message: error.message });
  }
};

// POST create new student
export const createStudent = async (req, res) => {
  try {
    const { name, phoneNumber, address, aadharCard, startDate, expiryDate, subscriptionMonths, paymentAmount, isPaymentDone: providedIsPaymentDone, profilePicture } = req.body;

    // Validation
    if (!name || !phoneNumber || !address || !aadharCard || paymentAmount === undefined || paymentAmount === null) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'phoneNumber', 'address', 'aadharCard', 'paymentAmount'],
      });
    }

    // Validate Aadhar card (should be 12 digits)
    if (!/^\d{12}$/.test(aadharCard)) {
      return res.status(400).json({
        error: 'Aadhar card must be exactly 12 digits',
      });
    }

    // Validate payment amount (should be positive)
    const payment = parseFloat(paymentAmount);
    if (isNaN(payment) || payment < 0) {
      return res.status(400).json({
        error: 'Payment amount must be a positive number',
      });
    }

    // Use current date as start date if not provided
    const subscriptionStartDate = startDate || new Date().toISOString().split('T')[0];
    
    // Validate that start date is not in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedStartDate = new Date(subscriptionStartDate);
    selectedStartDate.setHours(0, 0, 0, 0);
    
    if (selectedStartDate > today) {
      return res.status(400).json({
        error: 'Subscription start date cannot be in the future',
      });
    }
    
    // Validate subscription months (default to 1 if not provided)
    const months = subscriptionMonths ? parseInt(subscriptionMonths) : 1;
    if (isNaN(months) || months < 1 || months > 12) {
      return res.status(400).json({
        error: 'Subscription months must be between 1 and 12',
      });
    }
    
    // Calculate expiry date based on subscription months if not provided
    let subscriptionExpiryDate = expiryDate;
    if (!subscriptionExpiryDate) {
      const start = new Date(subscriptionStartDate);
      start.setMonth(start.getMonth() + months);
      subscriptionExpiryDate = start.toISOString().split('T')[0];
    }

    // Calculate isPaymentDone based on remaining amount if not provided
    const MONTHLY_FEE = 500;
    const requiredAmount = months * MONTHLY_FEE;
    const remainingAmount = Math.max(0, requiredAmount - payment);
    let isPaymentDone;
    
    if (providedIsPaymentDone !== undefined && providedIsPaymentDone !== null) {
      // Use provided value if explicitly set
      isPaymentDone = providedIsPaymentDone === true || providedIsPaymentDone === 'true';
    } else {
      // Auto-calculate: payment is done if remaining amount is 0
      isPaymentDone = remainingAmount === 0;
    }

    const studentId = uuidv4();
    
    // Generate student credentials
    const { username, password } = generateStudentCredentials(name, studentId);

    const studentData = {
      id: studentId,
      name,
      phoneNumber,
      address,
      aadharCard,
      startDate: subscriptionStartDate,
      expiryDate: subscriptionExpiryDate,
      subscriptionMonths: months,
      paymentAmount: payment,
      isPaymentDone: isPaymentDone,
      profilePicture:
        profilePicture ||
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    };

    const newStudent = await dbCreateStudent(studentData);
    
    // Set student credentials
    await setStudentCredentials(studentId, username, password);
    
    const studentWithStatus = {
      ...newStudent,
      subscriptionStatus: determineSubscriptionStatus(newStudent.expiryDate),
      username, // Include username in response
      password, // Include password in response (only on creation)
    };

    res.status(201).json(studentWithStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create student', message: error.message });
  }
};

// PUT update student
export const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, expiryDate, profilePicture } = req.body;

    const existingStudent = await dbGetStudentById(id);
    if (!existingStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const updatedStudent = await dbUpdateStudent(id, updateData);
    const studentWithStatus = {
      ...updatedStudent,
      subscriptionStatus: determineSubscriptionStatus(
        updatedStudent.expiryDate
      ),
    };

    res.json(studentWithStatus);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student', message: error.message });
  }
};

// DELETE student
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedStudent = await dbDeleteStudent(id);

    if (!deletedStudent) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student', message: error.message });
  }
};

// POST reset student password
export const resetStudentPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await dbGetStudentById(id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Generate new credentials
    const { username, password } = generateStudentCredentials(student.name, student.id);
    
    // Set the new credentials in the database
    await setStudentCredentials(student.id, username, password);
    
    res.json({
      username,
      password,
      message: 'Password reset successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset password', message: error.message });
  }
};

