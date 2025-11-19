# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to set up Firebase Cloud Messaging for push notifications in the Alok Library system.

## Overview

When an admin or teacher creates a notification in the system, all registered students will receive a push notification on their mobile devices via Firebase Cloud Messaging (FCM).

## Prerequisites

1. A Firebase project with Cloud Messaging enabled
2. Firebase Admin SDK service account credentials

## Setup Steps

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Enable **Cloud Messaging** in the project settings

### 2. Generate Service Account Key

1. In Firebase Console, go to **Project Settings** > **Service Accounts**
2. Click **Generate new private key**
3. Download the JSON file (this contains your service account credentials)

### 3. Configure Backend

1. Open the downloaded JSON file
2. Convert it to a single-line JSON string (you can use an online JSON minifier)
3. Add it to your `.env` file in the `backend` directory:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id",...}
```

**Note:** The entire JSON should be on a single line. Make sure to escape any quotes properly if needed.

### 4. Database Setup

The FCM tokens table will be automatically created when you start the server. The table structure:

- `student_fcm_tokens` - Stores FCM tokens for each student
  - `student_id` - References the student
  - `fcm_token` - The FCM token from the mobile app
  - `is_active` - Whether the token is currently active

## API Endpoints

### Register FCM Token (Student Only)

**POST** `/api/fcm-tokens`

Register or update the FCM token for the authenticated student.

**Request Body:**
```json
{
  "fcmToken": "your-fcm-token-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token registered successfully"
}
```

### Get FCM Token (Student Only)

**GET** `/api/fcm-tokens`

Get the current FCM token for the authenticated student.

**Response:**
```json
{
  "hasToken": true,
  "token": "your-fcm-token-here"
}
```

### Remove FCM Token (Student Only)

**DELETE** `/api/fcm-tokens/:token`

Remove (deactivate) an FCM token for the authenticated student.

**Response:**
```json
{
  "success": true,
  "message": "Token removed successfully"
}
```

## Mobile App Integration

### For Flutter Apps

1. Install the `firebase_messaging` package
2. Get the FCM token when the app starts:

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

FirebaseMessaging messaging = FirebaseMessaging.instance;
String? token = await messaging.getToken();
```

3. Register the token with your backend:

```dart
// After student login
await http.post(
  Uri.parse('https://your-api.com/api/fcm-tokens'),
  headers: {
    'Authorization': 'Bearer $authToken',
    'Content-Type': 'application/json',
  },
  body: jsonEncode({'fcmToken': token}),
);
```

4. Handle incoming notifications:

```dart
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  print('Got a message: ${message.notification?.title}');
  // Show notification to user
});

FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  print('Notification opened: ${message.data}');
  // Navigate to relevant screen
});
```

### For React Native Apps

1. Install `@react-native-firebase/messaging`
2. Get and register the FCM token:

```javascript
import messaging from '@react-native-firebase/messaging';

async function registerFCMToken() {
  const token = await messaging().getToken();
  
  await fetch('https://your-api.com/api/fcm-tokens', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fcmToken: token }),
  });
}
```

3. Handle notifications:

```javascript
messaging().onMessage(async remoteMessage => {
  console.log('Notification received:', remoteMessage);
  // Show notification
});

messaging().onNotificationOpenedApp(remoteMessage => {
  console.log('Notification opened:', remoteMessage);
  // Navigate to screen
});
```

## How It Works

1. **Student Registration**: When a student logs into the mobile app, the app gets an FCM token and registers it with the backend API.

2. **Notification Creation**: When an admin or teacher creates a notification:
   - The notification is saved to the database
   - The system automatically sends FCM push notifications to all registered students
   - The notification is sent asynchronously (non-blocking)

3. **Notification Delivery**: Students receive the push notification on their devices with:
   - Title: The notification title
   - Body: The notification message
   - Data: Notification type and ID for app routing

## Testing

1. Start the backend server
2. Register a test FCM token using the API
3. Create a notification as admin/teacher
4. Check the server logs for FCM sending status
5. Verify the notification appears on the test device

## Troubleshooting

### FCM Notifications Not Sending

1. **Check Firebase Configuration**: Ensure `FIREBASE_SERVICE_ACCOUNT` is properly set in `.env`
2. **Check Server Logs**: Look for Firebase initialization messages
3. **Verify Tokens**: Ensure students have registered valid FCM tokens
4. **Check Firebase Console**: Verify Cloud Messaging is enabled in your Firebase project

### Invalid Token Errors

- Tokens can become invalid if:
  - App is uninstalled
  - App data is cleared
  - Token expires (rare)
- The system will automatically handle invalid tokens and log warnings

### Firebase Not Initialized Warning

If you see "Firebase not initialized" warnings:
- Check that `FIREBASE_SERVICE_ACCOUNT` is set in your `.env` file
- Verify the JSON is valid and properly formatted
- Restart the server after updating the environment variable

## Security Notes

- FCM token endpoints are protected by authentication
- Only students can register/manage their own tokens
- Tokens are stored securely in the database
- Invalid tokens are automatically deactivated

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Flutter Firebase Messaging](https://firebase.flutter.dev/docs/messaging/overview)
- [React Native Firebase Messaging](https://rnfirebase.io/messaging/usage)

