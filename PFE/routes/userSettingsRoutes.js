const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const UserSettings = require('../models/UserSettings');
const {
  getSettings,
  updateNotifications,
  toggleNotifications,
  getNotificationStatus,
  updateDataViewer,
  updateAllowedNotificationTypes,
  updateSchedulerConfig,
  toggleSchedulerActivation,
  getAllowedNotificationTypes
} = require('../controllers/userSettingsController');

router.use(authMiddleware);

router.get('/', getSettings);
router.put('/notifications', updateNotifications);
router.put('/notifications/allowed-types', updateAllowedNotificationTypes);
router.put('/data-viewer', updateDataViewer);
router.patch('/notifications/toggle', toggleNotifications);
router.get('/notifications/status', getNotificationStatus);
router.patch('/scheduler/toggle', toggleSchedulerActivation);
router.put('/scheduler', updateSchedulerConfig);

router.patch('/', async (req, res) => {
  try {
    const updates = req.body;
    const scheduler = req.app.get('scheduler');

    // Validate schedulerConfig if present
    if (updates.schedulerConfig) {
      const { enabled, hours, days, months, weekdays } = updates.schedulerConfig;
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
    }

    // Prepare update object for schedulerConfig
    const updateFields = {};
    if (updates.schedulerConfig) {
      if (updates.schedulerConfig.enabled !== undefined) {
        updateFields['schedulerConfig.enabled'] = updates.schedulerConfig.enabled;
      }
      if (updates.schedulerConfig.hours) {
        updateFields['schedulerConfig.hours'] = updates.schedulerConfig.hours;
      }
      if (updates.schedulerConfig.days) {
        updateFields['schedulerConfig.days'] = updates.schedulerConfig.days;
      }
      if (updates.schedulerConfig.months) {
        updateFields['schedulerConfig.months'] = updates.schedulerConfig.months;
      }
      if (updates.schedulerConfig.weekdays) {
        updateFields['schedulerConfig.weekdays'] = updates.schedulerConfig.weekdays;
      }
    }

    // Update the settings
    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user._id },
      { $set: updateFields },
      { new: true, upsert: true }
    );

    // Reload scheduler configs dynamically if schedulerConfig is updated
    if (updates.schedulerConfig) {
      console.log('Rechargement des configurations du scheduler après mise à jour...');
      await scheduler.updateSchedulerConfigs();
    }

    res.json({
      success: true,
      message: 'Paramètres mis à jour',
      settings
    });
  } catch (error) {
    console.error('❌ Erreur mise à jour paramètres:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur', error: error.message });
  }
});

const { getSettingsByUserId } = require('../controllers/userSettingsController');

//router.get('/notifications/:userId', getSettingsByUserId); // pour AdminUsers
router.get('/notifications/:userId', getAllowedNotificationTypes);

module.exports = router;