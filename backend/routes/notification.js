const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { authMiddleware } = require('../middleware/auth');

/**
 * GET /api/notifications
 * Get all notifications for logged-in user
 * Latest first
 */
router.get('/', authMiddleware, getNotifications);

/**
 * PUT /api/notifications/:id/read
 * Mark notification as read
 */
router.put('/:id/read', authMiddleware, markAsRead);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', authMiddleware, markAllAsRead);

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;
