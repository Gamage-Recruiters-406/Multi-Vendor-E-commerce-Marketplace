import Notification from '../models/Notification.js';
import User from '../models/User.js';
import emailService from '../services/emailService.js';

class NotificationService {

  // Send notification to single user (optimized)
  async sendToUser(userOrId, notificationData) {
    try {
      const { type, title, message, data = {}, sendEmail = true } = notificationData;

      // Avoid extra DB call if user object already provided
      const user = typeof userOrId === "object"
        ? userOrId
        : await User.findById(userOrId);

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const userId = user._id;

      // Save notification
      const notification = await Notification.create({
        userId,
        type,
        title,
        message,
        data,
        isRead: false,
        emailSent: false,
      });

      // Send email (non-blocking 🚀)
      if (sendEmail && user.email) {
        const template = emailService.getEmailTemplate(type, {
          customerName: user.fullname,
          ...data
        });

        emailService.sendEmail(
          user.email,
          template.subject,
          template.html
        ).then(async (emailResult) => {
          if (emailResult.success) {
            await Notification.findByIdAndUpdate(notification._id, {
              emailSent: true
            });
          }
        }).catch(err => {
          console.error('Async email error:', err.message);
        });
      }

      return {
        success: true,
        notification,
        emailSent: false, // async, so initially false
      };

    } catch (error) {
      console.error('Send notification error:', error);
      return { success: false, error: error.message };
    }
  }


  // Send notification to multiple users (batch + parallel)
  async sendToMany(users, notificationData, batchSize = 50) {
    const results = {
      total: users.length,
      successful: 0,
      failed: 0,
      notifications: [],
      errors: [],
    };

    const delay = parseInt(process.env.BATCH_DELAY) || 500;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (user) => {
          try {
            const result = await this.sendToUser(user, notificationData);
            return { success: result.success, notification: result.notification };
          } catch (error) {
            return { success: false, error: error.message };
          }
        })
      );

      for (const res of batchResults) {
        if (res.success) {
          results.successful++;
          if (res.notification) {
            results.notifications.push(res.notification);
          }
        } else {
          results.failed++;
          results.errors.push(res.error);
        }
      }

      // Delay between batches (avoid SMTP/API rate limits)
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return results;
  }


  // Send to users by role
  async sendToRole(role, notificationData) {
    const users = await User.find({ role }).lean();
    return this.sendToMany(users, notificationData);
  }


  // Send to all users (⚠️ for large apps, use cursor instead)
  async sendToAll(notificationData) {
    const users = await User.find({}).lean();
    return this.sendToMany(users, notificationData);
  }


  // Send to specific audience
  async sendToAudience(targetAudiences, notificationData) {
    try {
      const conditions = [];

      if (targetAudiences.includes('All Users')) {
        const users = await User.find({}).lean();
        return this.sendToMany(users, notificationData);
      }

      if (targetAudiences.includes('Buyers Only')) {
        conditions.push({ role: 'Buyer' });
      }

      if (targetAudiences.includes('Vendors Only')) {
        conditions.push({ role: 'Vendor' });
      }

      if (targetAudiences.includes('Premium Members')) {
        conditions.push({ isPremium: true });
      }

      if (targetAudiences.includes('New Members')) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        conditions.push({ createdAt: { $gte: thirtyDaysAgo } });
      }

      if (conditions.length === 0) {
        return { success: false, error: 'No valid audience specified' };
      }

      const users = await User.find({ $or: conditions }).lean();

      // Remove duplicates
      const uniqueUsers = [
        ...new Map(users.map(u => [u._id.toString(), u])).values()
      ];

      return this.sendToMany(uniqueUsers, notificationData);

    } catch (error) {
      console.error('sendToAudience error:', error);
      return { success: false, error: error.message };
    }
  }


  // Get notifications (pagination)
  async getUserNotifications(userId, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),

      Notification.countDocuments({ userId })
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }


  // Get unread count
  async getUnreadCount(userId) {
    return Notification.countDocuments({ userId, isRead: false });
  }


  // Mark single as read
  async markAsRead(notificationId, userId) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { isRead: true },
      { new: true }
    );
  }


  // Mark all as read
  async markAllAsRead(userId) {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    return { count: result.modifiedCount };
  }


  // Delete notification
  async deleteNotification(notificationId, userId) {
    const result = await Notification.deleteOne({ _id: notificationId, userId });
    return { deleted: result.deletedCount > 0 };
  }
}

export default new NotificationService();