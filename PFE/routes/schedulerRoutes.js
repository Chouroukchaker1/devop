const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/authMiddleware');
const SchedulerHistory = require('../models/SchedulerHistory');

router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { limit = 10, status, startDate, endDate } = req.query;
    const query = {};

    const parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({ success: false, message: 'La limite doit être comprise entre 1 et 100' });
    }

    if (status && ['started', 'completed', 'failed'].includes(status)) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.startTime = {};
      if (startDate) query.startTime.$gte = new Date(startDate);
      if (endDate) query.startTime.$lte = new Date(endDate);
    }

    const schedulerInstance = req.app.get('scheduler');
    if (!schedulerInstance) {
      return res.status(500).json({ success: false, message: 'Scheduler non initialisé' });
    }

    const history = await SchedulerHistory.find(query)
      .sort({ startTime: -1 })
      .limit(parsedLimit);

    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error in /history:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/check-new-data', authMiddleware, async (req, res) => {
  try {
    const schedulerInstance = req.app.get('scheduler');
    if (!schedulerInstance) {
      return res.status(500).json({ success: false, message: 'Scheduler non initialisé' });
    }

    const report = await schedulerInstance.getNewDataReport();
    res.json({ success: true, data: report.data });
  } catch (error) {
    console.error('Error in /check-new-data:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});
router.put('/check-new-data', authMiddleware, async (req, res) => {
  try {
    const schedulerInstance = req.app.get('scheduler');
    if (!schedulerInstance) {
      return res.status(500).json({ success: false, message: 'Scheduler non initialisé' });
    }

    const { fileType, rowIndex, updateFields } = req.body;

    if (!['fuel_data', 'flight_data'].includes(fileType)) {
      return res.status(400).json({ success: false, message: 'Type de fichier invalide (fuel_data ou flight_data requis)' });
    }

    if (typeof rowIndex !== 'number' || rowIndex < 0) {
      return res.status(400).json({ success: false, message: 'Index de ligne invalide' });
    }

    if (!updateFields || typeof updateFields !== 'object') {
      return res.status(400).json({ success: false, message: 'Champs de mise à jour invalides' });
    }

    const updated = await schedulerInstance.updateNewData(fileType, rowIndex, updateFields);

    res.json({ success: true, message: 'Mise à jour effectuée avec succès.', updatedData: updated });

  } catch (error) {
    console.error('Erreur PUT /check-new-data :', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/trigger-processing', authMiddleware, async (req, res) => {
  try {
    const schedulerInstance = req.app.get('scheduler');
    if (!schedulerInstance) {
      return res.status(500).json({ success: false, message: 'Scheduler non initialisé' });
    }
    const result = await schedulerInstance.triggerDataProcessing();
    res.json(result);
  } catch (error) {
    console.error('Error in /trigger-processing:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;