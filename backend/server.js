import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import studentRoutes from './routes/students.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import noteRoutes from './routes/notes.js';
import expenseRoutes from './routes/expenses.js';
import { initializeDatabase } from './utils/dbUtils.js';
import { initializeDefaultUsers } from './utils/userUtils.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/expenses', expenseRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Alok Library API is running' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database tables
    await initializeDatabase();
    
    // Initialize default admin and teacher users
    await initializeDefaultUsers();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📚 Alok Library API is ready!`);
      console.log(`🗄️  Database: ${process.env.DB_NAME || 'alok_library'}`);
      console.log(`🔐 Default credentials:`);
      console.log(`   Admin: username=admin, password=admin123`);
      console.log(`   Teacher: username=teacher, password=teacher123`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

