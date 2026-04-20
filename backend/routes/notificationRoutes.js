// routes/notificationRoutes.js
import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { requiredSignIn } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(requiredSignIn);  

router.get('/', getNotifications);          
router.get('/unread-count', getUnreadCount); 
router.put('/mark-all-read', markAllAsRead); 
router.put('/:notificationId/read', markAsRead); 
router.delete('/:notificationId', deleteNotification); 

export default router;