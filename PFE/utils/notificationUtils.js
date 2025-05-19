const UserSettings = require('../models/UserSettings');

/**
 * Check if notifications are enabled for a user
 * @param {String} userId - The user ID to check
 * @returns {Boolean} Whether notifications are enabled
 */
exports.areNotificationsEnabled = async (userId) => {
  try {
    const settings = await UserSettings.findOne({ userId });
    
    if (!settings) {
      return true; // Default: notifications are enabled
    }
    
    return settings.notifications.enable;
  } catch (error) {
    console.error('Error checking notification settings:', error);
    return true; // Default to enabled in case of error
  }
};

// 3. Update the notification creation service
// Modify the createNotification function in notificationController.js
const { areNotificationsEnabled } = require('../utils/notificationUtils');

// Create a notification for the current user
exports.createNotification = async (req, res, next) => {
  try {
    const { type, message, metadata } = req.body;
    
    // Check if user has notifications enabled
    const notificationsEnabled = await areNotificationsEnabled(req.user._id);
    
    if (!notificationsEnabled) {
      return res.status(200).json({
        success: true,
        message: 'Notifications désactivées pour cet utilisateur',
        notificationCreated: false
      });
    }
    
    // Validate type before saving
    const validTypes = ['system', 'update', 'data_missing', 'alert', 'warning', 'success'];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Type de notification invalide. Les types autorisés sont: ${validTypes.join(', ')}`
      });
    }
    
    const newNotification = new Notification({
      userId: req.user._id,
      type,
      message,
      metadata,
      read: false
    });

    await newNotification.save();
    
    res.status(201).json({
      success: true,
      notification: newNotification,
      notificationCreated: true
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};