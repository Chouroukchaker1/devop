const express = require('express');
const router = express.Router();
const { 
  getUserNotifications, 
  getNotificationById,
  markAsRead, 
  getMissingDetails,
  createNotification,
  sendNotification  
} = require('../controllers/notificationController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Middleware d'authentification pour toutes les routes
router.use(authMiddleware);

// Routes
router.get('/', getUserNotifications); // GET /notifications
router.get('/:id', getNotificationById); // GET /notifications/:id
router.put('/:id/read', markAsRead); // PUT /notifications/:id/read
router.get('/missing-details/:id', getMissingDetails); // GET /missing-details/:id
router.post('/', createNotification); // POST /notifications
router.post('/send', sendNotification); // POST /notifications/send

module.exports = router;