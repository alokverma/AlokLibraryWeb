import {
  registerFCMToken,
  removeFCMToken,
  removeAllFCMTokensForStudent,
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
 * DELETE /fcm-tokens/:token? - Remove FCM token(s) for the authenticated student
 * Supports three methods:
 * 1. No token provided: DELETE /api/fcm-tokens - Removes ALL tokens for the student (logout scenario)
 * 2. Token in request body: DELETE /api/fcm-tokens with { "fcmToken": "..." } (recommended)
 * 3. Token in URL path: DELETE /api/fcm-tokens/:token (requires URL encoding)
 */
export const removeToken = async (req, res) => {
  try {
    const user = req.user;
    
    // Only students can remove their own tokens
    if (user.role !== 'student') {
      return res.status(403).json({
        error: 'Only students can remove FCM tokens',
      });
    }

    // Try to get token from request body first (recommended method)
    let fcmToken = req.body?.fcmToken;
    
    // If not in body, try URL parameter (fallback)
    if (!fcmToken && req.params?.token) {
      fcmToken = req.params.token;
    }

    // If no token provided, remove all tokens for this student (logout scenario)
    if (!fcmToken) {
      const result = await removeAllFCMTokensForStudent(user.id);
      return res.json(result);
    }

    const result = await removeFCMToken(user.id, fcmToken);
    
    // If token not found, return 404
    if (!result.success && result.message.includes('not found')) {
      return res.status(404).json(result);
    }
    
    // If successful or other error, return appropriate status
    if (result.success) {
      return res.json(result);
    } else {
      return res.status(400).json(result);
    }
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

