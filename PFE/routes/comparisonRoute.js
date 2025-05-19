const express = require('express');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');
const xlsx = require('xlsx');
const fs = require('fs');
const FuelData = require('../models/FeulData');
const FlightData = require('../models/flightDataModel');
const Notification = require('../models/Notification');
const SchedulerHistory = require('../models/SchedulerHistory');

const router = express.Router();

// File paths (same as in the provided code)
const FUEL_DATA_PATH = 'C:/Users/lenovo/Desktop/PFE/datax/data/all_fuel_data.xlsx';
const FLIGHT_DATA_PATH = 'C:/Users/lenovo/Desktop/PFE/sample_data/dataRaportProcessed.xlsx';

// Helper to read Excel file
const readExcelFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }
  const workbook = xlsx.readFile(filePath);
  const data = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '' });
  return data;
};

// Helper to compare arrays of objects
const compareData = (oldData, newData, keyFields) => {
  const newRecords = [];
  const oldDataMap = new Map();

  // Create a map of old data using key fields
  oldData.forEach(item => {
    const key = keyFields.map(field => item[field]).join('-');
    oldDataMap.set(key, item);
  });

  // Check for new or updated records
  newData.forEach(item => {
    const key = keyFields.map(field => item[field]).join('-');
    if (!oldDataMap.has(key)) {
      newRecords.push(item);
    } else {
      const oldItem = oldDataMap.get(key);
      // Check if any field has changed
      const hasChanges = Object.keys(item).some(field => 
        JSON.stringify(item[field]) !== JSON.stringify(oldItem[field])
      );
      if (hasChanges) {
        newRecords.push(item);
      }
    }
  });

  return newRecords;
};

// Route to compare data before and after scheduler
router.get(
  '/compare-data',
  authMiddleware,
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
  async (req, res) => {
    console.log('✅ Route GET /api/transfer/compare-data reached');
    try {
      // 1. Get the latest scheduler history
      const latestHistory = await SchedulerHistory.findOne()
        .sort({ startTime: -1 })
        .lean();

      if (!latestHistory) {
        return res.status(404).json({
          success: false,
          message: 'No scheduler history found. Scheduler has not run yet.'
        });
      }

      // 2. Get data from database before scheduler (previous state)
      const preSchedulerFuelData = await FuelData.find({
        createdAt: { $lt: latestHistory.startTime }
      }).lean();

      const preSchedulerFlightData = await FlightData.find({
        createdAt: { $lt: latestHistory.startTime }
      }).lean();

      // 3. Get current data from database (after scheduler)
      const postSchedulerFuelData = await FuelData.find({
        createdAt: { $gte: latestHistory.startTime }
      }).lean();

      const postSchedulerFlightData = await FlightData.find({
        createdAt: { $gte: latestHistory.startTime }
      }).lean();

      // 4. Read Excel files for additional comparison
      let fuelDataRaw = [];
      let flightDataRaw = [];
      try {
        fuelDataRaw = readExcelFile(FUEL_DATA_PATH);
        flightDataRaw = readExcelFile(FLIGHT_DATA_PATH);
      } catch (error) {
        console.warn(`Error reading Excel files: ${error.message}`);
      }

      // 5. Compare fuel data
      const newFuelRecords = compareData(
        preSchedulerFuelData,
        postSchedulerFuelData,
        ['flightNumber', 'dateOfFlight', 'timeOfDeparture']
      );

      // 6. Compare flight data
      const newFlightRecords = compareData(
        preSchedulerFlightData,
        postSchedulerFlightData,
        ['flightID', 'dateOfOperationUTC']
      );

      // 7. Check if there are any new records
      if (newFuelRecords.length === 0 && newFlightRecords.length === 0) {
        // Create notification for empty extraction
        try {
          const notification = new Notification({
            userId: req.user._id,
            message: 'Extraction des données vide: Aucune nouvelle donnée ou mise à jour détectée.',
            read: false,
            type: 'info'
          });
          await notification.save();
        } catch (notifError) {
          console.warn(`Notification not created: ${notifError.message}`);
        }

        return res.status(200).json({
          success: true,
          message: 'Extraction des données vide: Aucune nouvelle donnée ou mise à jour détectée.',
          newFuelRecords: [],
          newFlightRecords: []
        });
      }

      // 8. Create notification for new data
      try {
        const notification = new Notification({
          userId: req.user._id,
          message: `Nouvelles données détectées: ${newFuelRecords.length} enregistrements de carburant, ${newFlightRecords.length} enregistrements de vol.`,
          read: false,
          type: 'success'
        });
        await notification.save();
      } catch (notifError) {
        console.warn(`Notification not created: ${notifError.message}`);
      }

      // 9. Respond with new records
      res.status(200).json({
        success: true,
        message: 'Comparaison des données terminée avec succès.',
        newFuelRecords,
        newFlightRecords,
        fuelCount: newFuelRecords.length,
        flightCount: newFlightRecords.length
      });

    } catch (error) {
      console.error('❌ Error in /compare-data:', error);
      res.status(500).json({
        success: false,
        message: `Erreur du serveur: ${error.message}`,
        details: error.stack
      });
    }
  }
);

module.exports = router;