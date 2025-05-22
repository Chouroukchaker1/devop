const UserSettings = require('../models/UserSettings');
const DataScheduler = require('../services/scheduler.js'); // Importer DataScheduler
const scheduler = new DataScheduler();
// Récupérer tous les paramètres
exports.getSettings = async (req, res) => {
  console.log('📥 Route GET /api/user-settings appelée');

  try {
    let settings = await UserSettings.findOne({ userId: req.user._id });

    if (!settings) {
      settings = new UserSettings({ userId: req.user._id });
      await settings.save();
    }

    res.json({ success: true, settings });
  } catch (error) {
    console.error('❌ Erreur route GET /api/user-settings :', error);
    handleError(res, error, 'Erreur lors de la récupération des paramètres utilisateur');
  }
};

// Mettre à jour toutes les notifications
// Mettre à jour partiellement les notifications
exports.updateNotifications = async (req, res) => {
  try {
    const updateFields = req.body.notifications;

    if (!updateFields || typeof updateFields !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Les paramètres de notification sont requis et doivent être un objet.'
      });
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user._id },
      { $set: Object.entries(updateFields).reduce((acc, [key, value]) => {
        acc[`notifications.${key}`] = value;
        return acc;
      }, {}) },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Paramètres de notifications mis à jour',
      settings
    });
  } catch (error) {
    handleError(res, error, 'Erreur lors de la mise à jour des notifications');
  }
};

// Mettre à jour les types de notifications autorisés via userId
exports.updateAllowedNotificationTypes = async (req, res) => {
  try {
    const { userId, allowedNotificationTypes } = req.body;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'userId est requis et doit être une chaîne valide.'
      });
    }

    if (!Array.isArray(allowedNotificationTypes)) {
      return res.status(400).json({
        success: false,
        message: 'allowedNotificationTypes doit être un tableau de chaînes.'
      });
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId },
      {  'notifications.allowedTypes': allowedNotificationTypes },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: `Types de notifications autorisés mis à jour pour l'utilisateur ${userId}`,
      settings
    });
  } catch (error) {
    handleError(res, error, 'Erreur lors de la mise à jour des types de notifications');
  }
};

// Mettre à jour les paramètres de dataViewer
exports.updateDataViewer = async (req, res) => {
  try {
    const { dataViewer } = req.body;

    if (!dataViewer || typeof dataViewer !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Les paramètres de dataViewer sont requis et doivent être un objet.'
      });
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user._id },
      { dataViewer },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Paramètres dataViewer mis à jour',
      settings
    });
  } catch (error) {
    handleError(res, error, 'Erreur lors de la mise à jour de dataViewer');
  }
};

// Basculer l’état général des notifications
exports.toggleNotifications = async (req, res) => {
  try {
    const { enable } = req.body;

    validateBoolean(enable, res);

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user._id },
      { 'notifications.enabled': enable },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: enable ? 'Notifications activées' : 'Notifications désactivées',
      settings
    });
  } catch (error) {
    handleError(res, error, 'Erreur lors de la bascule des notifications');
  }
};

// Obtenir le statut des notifications
exports.getNotificationStatus = async (req, res) => {
  try {
    const settings = await UserSettings.findOne({ userId: req.user._id });

    res.json({
      success: true,
       notificationsEnabled: settings?.notifications?.enabled ?? true

    });
  } catch (error) {
    handleError(res, error, 'Erreur lors de la lecture du statut des notifications');
  }
};

// Helper : validation boolean
const validateBoolean = (value, res) => {
  if (typeof value !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'Valeur booléenne invalide'
    });
  }
};

// Helper : gestion des erreurs
const handleError = (res, error, context) => {
  console.error(`${context}:`, error);
  res.status(500).json({
    success: false,
    message: 'Erreur serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
};
// Mettre à jour la configuration du scheduler
exports.updateSchedulerConfig = async (req, res) => {
  try {
    const { schedulerConfig } = req.body;
    const user = req.user;

    // Vérifier les rôles autorisés
    const allowedRoles = ['admin', 'fueldatamaster', 'fueluser'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n’êtes pas autorisé à configurer le scheduler.',
      });
    }

    // Valider les données de schedulerConfig
    if (!schedulerConfig || typeof schedulerConfig !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'La configuration du scheduler est requise et doit être un objet.',
      });
    }

    // Valider les champs spécifiques
    const { enabled, hours, days, months, weekdays, startDate } = schedulerConfig;
    if (enabled !== undefined && typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le champ enabled doit être un booléen.',
      });
    }
    if (hours && (!Array.isArray(hours) || hours.some(h => !Number.isInteger(h) || h < 0 || h > 23))) {
      return res.status(400).json({
        success: false,
        message: 'Les heures doivent être un tableau de nombres entiers entre 0 et 23.',
      });
    }
    if (days && (!Array.isArray(days) || days.some(d => !Number.isInteger(d) || d < 1 || d > 31))) {
      return res.status(400).json({
        success: false,
        message: 'Les jours doivent être un tableau de nombres entiers entre 1 et 31.',
      });
    }
    if (months && (!Array.isArray(months) || months.some(m => !Number.isInteger(m) || m < 1 || m > 12))) {
      return res.status(400).json({
        success: false,
        message: 'Les mois doivent être un tableau de nombres entiers entre 1 et 12.',
      });
    }
    if (weekdays && (!Array.isArray(weekdays) || weekdays.some(w => !Number.isInteger(w) || w < 0 || w > 6))) {
      return res.status(400).json({
        success: false,
        message: 'Les jours de la semaine doivent être un tableau de nombres entiers entre 0 et 6.',
      });
    }
    if (startDate && isNaN(Date.parse(startDate))) {
      return res.status(400).json({
        success: false,
        message: 'Le champ startDate doit être une date valide au format ISO.',
      });
    }

    // Mettre à jour la configuration dans la base
    const settings = await UserSettings.findOneAndUpdate(
      { userId: user._id },
      { $set: { schedulerConfig } },
      { new: true, upsert: true }
    );

    // 🔄 Recharger dynamiquement les jobs après la mise à jour
    await scheduler.updateSchedulerConfigs();

    res.json({
      success: true,
      message: 'Configuration du scheduler mise à jour.',
      settings,
    });
  } catch (error) {
    handleError(res, error, 'Erreur lors de la mise à jour de la configuration du scheduler');
  }
};
// ✅ Activer/désactiver dynamiquement le déclenchement du scheduler
exports.toggleSchedulerActivation = async (req, res) => {
  try {
    const { enabled } = req.body;
    const user = req.user;

    const allowedRoles = ['admin', 'fueldatamaster', 'fueluser'];
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Vous n’êtes pas autorisé à modifier le statut du scheduler.',
      });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le champ "enabled" doit être un booléen.',
      });
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId: user._id },
      { $set: { 'schedulerConfig.enabled': enabled } },
      { new: true, upsert: true }
    );

    // Recharger dynamiquement les jobs planifiés
    await scheduler.updateSchedulerConfigs();

    res.json({
      success: true,
      message: enabled ? 'Scheduler activé' : 'Scheduler désactivé',
      settings
    });
  } catch (error) {
    handleError(res, error, 'Erreur lors du changement d’état du scheduler');
  }
};
// Obtenir les paramètres d’un utilisateur par son ID (pour affichage admin)
exports.getSettingsByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const settings = await UserSettings.findOne({ userId });

    if (!settings) {
      return res.status(404).json({
        success: false,
        message: 'Paramètres utilisateur non trouvés',
      });
    }

    res.json({ success: true, settings });
  } catch (error) {
    handleError(res, error, 'Erreur lors de la récupération des paramètres utilisateur par ID');
  }
};
// ➕ Nouvelle route : récupérer les types autorisés pour un user
// Récupérer les types de notifications autorisés pour un utilisateur spécifique
exports.getAllowedNotificationTypes = async (req, res) => {
  try {
    const userId = req.params.userId;

    const settings = await UserSettings.findOne({ userId });

    if (!settings) {
      // Créer les paramètres si inexistants
      const newSettings = new UserSettings({ userId });
      await newSettings.save();
      return res.json({ settings: newSettings });
    }

    res.json({ settings });
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications',
      error: error.message
    });
  }
};


