import { findUserByUsername, verifyStudentPassword, updateStudentLoginDate } from '../utils/userUtils.js';
import { comparePassword, generateToken } from '../utils/auth.js';

// Login endpoint
export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log('[auth/login] Attempt:', {
      username,
      bodyPresent: !!req.body,
    });

    if (!username || !password) {
      return res.status(400).json({
        error: 'Username and password are required',
      });
    }

    // Try to find user (admin/teacher) first
    let user = await findUserByUsername(username);
    let userData = null;

    if (user) {
      // Verify password for admin/teacher
      const isValid = await comparePassword(password, user.password_hash);
      console.log('[auth/login] Admin/Teacher lookup:', {
        userId: user.id,
        role: user.role,
        isValid,
      });
      if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      userData = {
        id: user.id,
        username: user.username,
        role: user.role,
      };
    } else {
      // Try to find student
      userData = await verifyStudentPassword(username, password);
      console.log('[auth/login] Student lookup:', {
        found: !!userData,
        studentId: userData?.id,
      });
      if (!userData) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login date (no password expiry)
      if (userData.role === 'student') {
        await updateStudentLoginDate(userData.id);
      }
    }

    // Generate token
    const token = generateToken(userData);

    res.json({
      token,
      user: {
        id: userData.id,
        username: userData.username,
        role: userData.role,
        name: userData.name || null,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
};

// Verify token endpoint
export const verify = async (req, res) => {
  try {
    // If we reach here, the authenticate middleware has already verified the token
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Token verification failed' });
  }
};

