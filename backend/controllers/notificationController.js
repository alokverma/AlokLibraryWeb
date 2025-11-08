import {
  getAllNotifications as dbGetAllNotifications,
  getNotificationById as dbGetNotificationById,
  createNotification as dbCreateNotification,
  updateNotification as dbUpdateNotification,
  deleteNotification as dbDeleteNotification,
} from '../utils/notificationUtils.js';

// GET all notifications
export const getAllNotifications = async (req, res) => {
  try {
    const user = req.user;
    const activeOnly = req.query.activeOnly === 'true';
    
    // Students can only see active notifications
    const notifications = await dbGetAllNotifications(user.role === 'student' || activeOnly);
    
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications', message: error.message });
  }
};

// GET notification by ID
export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await dbGetNotificationById(id);

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notification', message: error.message });
  }
};

// POST create notification
export const createNotification = async (req, res) => {
  try {
    const { title, message, type } = req.body;
    const user = req.user;

    // Validation
    if (!title || !message || !type) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['title', 'message', 'type'],
      });
    }

    // Validate type
    const validTypes = ['exam', 'event', 'library', 'motivation', 'form', 'general'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid notification type',
        validTypes,
      });
    }

    const notificationData = {
      title,
      message,
      type,
      createdBy: user.id,
    };

    const newNotification = await dbCreateNotification(notificationData);

    res.status(201).json(newNotification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create notification', message: error.message });
  }
};

// PUT update notification
export const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type, isActive } = req.body;

    const existingNotification = await dbGetNotificationById(id);
    if (!existingNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (message !== undefined) updateData.message = message;
    if (type !== undefined) {
      const validTypes = ['exam', 'event', 'library', 'motivation', 'form', 'general'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: 'Invalid notification type',
          validTypes,
        });
      }
      updateData.type = type;
    }
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedNotification = await dbUpdateNotification(id, updateData);

    res.json(updatedNotification);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notification', message: error.message });
  }
};

// DELETE notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedNotification = await dbDeleteNotification(id);

    if (!deletedNotification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully', id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification', message: error.message });
  }
};

