import {
  registerFCMToken,
  removeFCMToken,
  getFCMTokenForStudent,
} from '../utils/fcmTokenUtils.js';

/**
 * POST /fcm-tokens - Register or update FCM token for the authenticated student
 */
export const registerToken = async (req, res) => {
  try {
    const user = req.user;
    const { fcmToken } = req.body;

    // Only students can register their own tokens
    if (user.role !== 'student') {
      return res.status(403).json({
        error: 'Only students can register FCM tokens',
      });
    }

    if (!fcmToken) {
      return res.status(400).json({
        error: 'FCM token is required',
      });
    }

    const result = await registerFCMToken(user.id, fcmToken);
    res.json(result);
  } catch (error) {
    console.error('Error registering FCM token:', error);
    res.status(500).json({
      error: 'Failed to register FCM token',
      message: error.message,
    });
  }
};

/**
 * DELETE /fcm-tokens/:token - Remove FCM token for the authenticated student
 */
export const removeToken = async (req, res) => {
  try {
    const user = req.user;
    const { token } = req.params;

    // Only students can remove their own tokens
    if (user.role !== 'student') {
      return res.status(403).json({
        error: 'Only students can remove FCM tokens',
      });
    }

    if (!token) {
      return res.status(400).json({
        error: 'FCM token is required',
      });
    }

    const result = await removeFCMToken(user.id, token);
    res.json(result);
  } catch (error) {
    console.error('Error removing FCM token:', error);
    res.status(500).json({
      error: 'Failed to remove FCM token',
      message: error.message,
    });
  }
};

/**
 * GET /fcm-tokens - Get FCM token for the authenticated student
 */
export const getToken = async (req, res) => {
  try {
    const user = req.user;

    // Only students can get their own token
    if (user.role !== 'student') {
      return res.status(403).json({
        error: 'Only students can get FCM tokens',
      });
    }

    const token = await getFCMTokenForStudent(user.id);
    res.json({
      hasToken: !!token,
      token: token || null,
    });
  } catch (error) {
    console.error('Error getting FCM token:', error);
    res.status(500).json({
      error: 'Failed to get FCM token',
      message: error.message,
    });
  }
};

