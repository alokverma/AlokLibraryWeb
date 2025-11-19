import admin from 'firebase-admin';
import { getFCMTokensForAllStudents } from './fcmTokenUtils.js';

// Initialize Firebase Admin SDK
let firebaseInitialized = false;

export const initializeFirebase = () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    // Option 1: Full service account JSON (recommended for most cases)
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
    
    // Option 2: Individual credentials (alternative approach)
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

    if (serviceAccount) {
      // Use full service account JSON
      try {
        const serviceAccountObj = JSON.parse(serviceAccount);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountObj),
        });
        firebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized successfully (using service account JSON)');
        return;
      } catch (error) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', error.message);
        return;
      }
    } else if (projectId && privateKey && clientEmail) {
      // Use individual credentials
      try {
        // Replace escaped newlines in private key
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');
        
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: projectId,
            privateKey: formattedPrivateKey,
            clientEmail: clientEmail,
          }),
        });
        firebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized successfully (using individual credentials)');
        return;
      } catch (error) {
        console.error('Failed to initialize Firebase with individual credentials:', error.message);
        return;
      }
    } else {
      // No credentials provided
      console.warn('⚠️  Firebase service account not configured. FCM notifications will be disabled.');
      console.warn('📝 To enable FCM, set one of the following:');
      console.warn('   1. FIREBASE_SERVICE_ACCOUNT (full JSON as single-line string) - Recommended');
      console.warn('   2. FIREBASE_PROJECT_ID + FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL - Alternative');
      return;
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin SDK:', error.message);
    console.error('FCM notifications will be disabled.');
  }
};

/**
 * Send push notification to all students
 * @param {Object} notification - Notification object with title, message, type
 * @returns {Promise<Object>} Result of sending notifications
 */
export const sendNotificationToAllStudents = async (notification) => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized. Skipping FCM notification.');
    return { success: false, message: 'Firebase not initialized' };
  }

  try {
    // Get all FCM tokens for students
    const tokens = await getFCMTokensForAllStudents();
    
    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens found. Skipping push notification.');
      return { success: true, message: 'No tokens to send to', sent: 0 };
    }

    // Prepare the notification payload
    const message = {
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type || 'general',
        notificationId: notification.id || '',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'alok_library_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    // Send to all tokens
    const response = await admin.messaging().sendEachForMulticast({
      tokens: tokens,
      ...message,
    });

    console.log(`Successfully sent ${response.successCount} notifications`);
    if (response.failureCount > 0) {
      console.log(`Failed to send ${response.failureCount} notifications`);
      // Remove invalid tokens
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      if (failedTokens.length > 0) {
        console.log('Removing invalid tokens:', failedTokens.length);
        // You might want to remove these tokens from the database
        // await removeInvalidTokens(failedTokens);
      }
    }

    return {
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      total: tokens.length,
    };
  } catch (error) {
    console.error('Error sending FCM notifications:', error);
    return {
      success: false,
      message: error.message,
    };
  }
};

/**
 * Send push notification to a specific student
 * @param {string} fcmToken - FCM token of the student
 * @param {Object} notification - Notification object
 * @returns {Promise<Object>} Result of sending notification
 */
export const sendNotificationToStudent = async (fcmToken, notification) => {
  if (!firebaseInitialized) {
    console.warn('Firebase not initialized. Skipping FCM notification.');
    return { success: false, message: 'Firebase not initialized' };
  }

  if (!fcmToken) {
    return { success: false, message: 'No FCM token provided' };
  }

  try {
    const message = {
      token: fcmToken,
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type || 'general',
        notificationId: notification.id || '',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channelId: 'alok_library_notifications',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('Successfully sent notification:', response);
    
    return {
      success: true,
      messageId: response,
    };
  } catch (error) {
    console.error('Error sending FCM notification:', error);
    
    // Check if token is invalid
    if (error.code === 'messaging/invalid-registration-token' || 
        error.code === 'messaging/registration-token-not-registered') {
      return {
        success: false,
        message: 'Invalid or unregistered token',
        shouldRemoveToken: true,
      };
    }
    
    return {
      success: false,
      message: error.message,
    };
  }
};

