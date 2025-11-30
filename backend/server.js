import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import studentRoutes from './routes/students.js';
import authRoutes from './routes/auth.js';
import analyticsRoutes from './routes/analytics.js';
import notificationRoutes from './routes/notifications.js';
import noteRoutes from './routes/notes.js';
import expenseRoutes from './routes/expenses.js';
import fcmTokenRoutes from './routes/fcmTokens.js';
import chatRoutes from './routes/chat.js';
import currentAffairsRoutes from './routes/currentAffairs.js';
import { initializeDatabase } from './utils/dbUtils.js';
import { initializeDefaultUsers } from './utils/userUtils.js';
import { initializeFirebase } from './utils/firebaseService.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];
const corsOptions = {
  origin: rawOrigins.length ? rawOrigins : true,
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (privacy policy, etc.)
const publicPath = path.resolve(__dirname, 'public');
if (fs.existsSync(publicPath)) {
  app.use('/public', express.static(publicPath));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/fcm-tokens', fcmTokenRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/current-affairs', currentAffairsRoutes);

if (process.env.SERVE_FRONTEND === 'true') {
  const distPath = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn(`⚠️  SERVE_FRONTEND is enabled but dist folder not found at ${distPath}`);
  }
}

if (process.env.SERVE_FRONTEND === 'true') {
  const distPath = path.resolve(__dirname, '../dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    console.warn(`⚠️  SERVE_FRONTEND is enabled but dist folder not found at ${distPath}`);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Alok Library API is running' });
});

// Privacy Policy endpoint
app.get('/privacy-policy', (req, res) => {
  const privacyPolicyPath = path.join(__dirname, 'public', 'privacy-policy.html');
  if (fs.existsSync(privacyPolicyPath)) {
    res.sendFile(privacyPolicyPath);
  } else {
    res.status(404).json({ error: 'Privacy policy not found' });
  }
});

// Privacy Policy API endpoint (returns JSON for mobile apps)
app.get('/api/privacy-policy', (req, res) => {
  res.json({
    url: `${req.protocol}://${req.get('host')}/privacy-policy`,
    lastUpdated: '2024-11-19',
    version: '1.0'
  });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Initialize database tables
    await initializeDatabase();
    
    // Initialize Firebase Admin SDK
    initializeFirebase();
    
    // Initialize default admin and teacher users
    await initializeDefaultUsers();
    
    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`📚 Alok Library API is ready!`);
      console.log(`🗄️  Database: ${process.env.DB_NAME || 'alok_library'}`);
      console.log(`🔐 Admin and Teacher accounts initialized`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

