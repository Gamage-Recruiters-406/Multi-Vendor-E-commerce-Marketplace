// controllers/notificationController.js
import notificationService from '../services/notificationService.js';

// Get user's notifications
export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await notificationService.getUserNotifications(
      req.user._id,
      page,
      limit
    );
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationService.getUnreadCount(req.user._id);
    
    res.json({
      success: true,
      unreadCount: count,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting unread count',
      error: error.message,
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const notification = await notificationService.markAsRead(
      notificationId,
      req.user._id
    );
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message,
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const result = await notificationService.markAllAsRead(req.user._id);
    
    res.json({
      success: true,
      message: `${result.count} notifications marked as read`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error marking all as read',
      error: error.message,
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    
    const result = await notificationService.deleteNotification(
      notificationId,
      req.user._id
    );
    
    if (!result.deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message,
    });
  }
};