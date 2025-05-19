const Notification = require('../models/Notification');
const User = require('../models/User');
const NotificationService = require('../services/notificationService');
const UserSettings = require('../models/UserSettings');
// Récupérer toutes les notifications de l'utilisateur
 

exports.getUserNotifications = async (req, res, next) => {
  try {
    const [notifications, settings] = await Promise.all([
      Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }),
      UserSettings.findOne({ userId: req.user._id })
    ]);

    res.json({
      success: true,
      notifications,
      allowedNotificationTypes: settings?.notifications?.allowedNotificationTypes || []
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    next(error);
  }
};


// Compter les notifications non lues
exports.getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ success: true, count });
  } catch (error) {
    console.error('Erreur lors du comptage des notifications non lues:', error);
    next(error);
  }
};

// Récupérer une notification par ID
exports.getNotificationById = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification non trouvée' });
    }
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    res.json(notification);
  } catch (error) {
    console.error('Erreur lors de la récupération de la notification par ID:', error);
    next(error);
  }
};

// Marquer une notification comme lue
exports.markAsRead = async (req, res, next) => {
  try {
    const updatedNotification = await NotificationService.markAsRead(req.params.id, req.user._id);
    if (!updatedNotification) {
      return res.status(404).json({ success: false, message: 'Notification non trouvée ou accès non autorisé' });
    }
    res.json(updatedNotification);
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    next(error);
  }
};

// Marquer toutes les notifications comme lues
exports.markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
    res.json({ success: true, message: 'Toutes les notifications ont été marquées comme lues' });
  } catch (error) {
    console.error('Erreur lors du marquage de toutes les notifications comme lues:', error);
    next(error);
  }
};

// Récupérer les détails manquants d'une notification
exports.getMissingDetails = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification non trouvée' });
    }
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }
    res.json({
      success: true,
      missingDetails: notification.metadata?.missingDetails || [],
    });
  } catch (error) {
    console.error('Erreur dans getMissingDetails:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement de la demande',
      error: process.env.NODE_ENV === 'production' ? {} : error.message,
    });
  }
};

// Créer une notification pour l'utilisateur actuel
exports.createNotification = async (req, res, next) => {
  try {
    const { type, message, metadata } = req.body;
    const validTypes = [
      'system',
      'update',
      'data_missing',
      'alert',
      'warning',
      'success',
      'importation_data_refusée',
      'erreur',
      'avertissement_donnée_manquante',
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Type de notification invalide. Les types autorisés sont: ${validTypes.join(', ')}`,
      });
    }
    const notification = await NotificationService.createNotification(req.user._id, type, message, metadata);
    if (!notification) {
      return res.status(200).json({
        success: true,
        message: 'Notifications désactivées pour cet utilisateur',
        notificationCreated: false,
      });
    }
    res.status(201).json({
      success: true,
      notification,
      notificationCreated: true,
    });
  } catch (error) {
    console.error('Erreur lors de la création de la notification:', error);
    res.status(500).json({
      success: false,
      message: 'Échec de la création de la notification',
      error: process.env.NODE_ENV === 'production' ? {} : error.message,
    });
  }
};
exports.sendNotification = async (req, res, next) => {
  try {
    const { userId, username, type, message, metadata } = req.body;

    // Restrict to admin and fueldatamaster roles
    if (!req.user || !['admin', 'fueldatamaster'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé : rôle insuffisant',
      });
    }

    // Allow admin and fueldatamaster to send specific notifications to multiple users
    if (req.body.users && Array.isArray(req.body.users)) {
      const notifications = [];
      for (const userEntry of req.body.users) {
        const { userId, username, type, message, metadata } = userEntry;

        // Vérifier que soit userId soit username est fourni
        if (!userId && !username) {
          return res.status(400).json({
            success: false,
            message: "L'ID utilisateur ou le nom d'utilisateur est requis pour chaque utilisateur",
          });
        }

        let targetUserId = userId;

        // Si username est fourni, récupérer l'userId correspondant
        if (username) {
          const user = await User.findOne({ username });
          if (!user) {
            return res.status(404).json({
              success: false,
              message: `Utilisateur non trouvé pour le nom d'utilisateur ${username}`,
            });
          }
          targetUserId = user._id;
        }

        // Valider le type de notification pour cet utilisateur
        if (!validTypes.includes(type)) {
          return res.status(400).json({
            success: false,
            message: `Type de notification invalide pour l'utilisateur ${username || targetUserId}. Les types autorisés sont: ${validTypes.join(', ')}`,
          });
        }

        // Créer la notification pour cet utilisateur
        const notification = await NotificationService.createNotification(targetUserId, type, message, metadata);
        if (notification) {
          notifications.push({ userId: targetUserId, notification });
        }
      }

      return res.status(201).json({
        success: true,
        notifications,
        notificationSent: true,
      });
    }

    // Vérifier que soit userId soit username est fourni
    if (!userId && !username) {
      return res.status(400).json({
        success: false,
        message: "L'ID utilisateur ou le nom d'utilisateur est requis",
      });
    }

    let targetUserId = userId;

    // Si username est fourni, récupérer l'userId correspondant
    if (username) {
      const user = await User.findOne({ username });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Utilisateur non trouvé pour le nom d'utilisateur fourni",
        });
      }
      targetUserId = user._id;
    }

    // Valider le type de notification
    const validTypes = [
      'system',
      'update',
      'data_missing',
      'alert',
      'warning',
      'success',
      'importation_data_refusée',
      'erreur',
      'avertissement_donnée_manquante',
    ];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Type de notification invalide. Les types autorisés sont: ${validTypes.join(', ')}`,
      });
    }

    // Créer la notification avec l'userId cible
    const notification = await NotificationService.createNotification(targetUserId, type, message, metadata);
    if (!notification) {
      return res.status(200).json({
        success: true,
        message: 'Notifications désactivées pour cet utilisateur',
        notificationSent: false,
      });
    }

    res.status(201).json({
      success: true,
      notification,
      notificationSent: true,
    });
  } catch (error) {
    console.error("Erreur lors de l'envoi de la notification:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de l'envoi de la notification",
      error: process.env.NODE_ENV === 'production' ? {} : error.message,
    });
  }
};
