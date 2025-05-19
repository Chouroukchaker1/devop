const express = require('express');
const { body } = require('express-validator');
const fuelDataController = require('../controllers/fuelDataController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');

const router = express.Router();

const fuelDataValidation = [
  body('dateOfFlight').isISO8601().withMessage('Invalid flight date'),
  body('timeOfDeparture').notEmpty().withMessage('Departure time required'),
  body('flightNumber').notEmpty().withMessage('Flight number required'),
  body('departureAirport').notEmpty().withMessage('Departure airport required'),
  body('arrivalAirport').notEmpty().withMessage('Arrival airport required'),
  body('taxiFuel').optional().isFloat({ min: 0 }).withMessage('Taxi fuel must be a positive number'),
  body('tripFuel').optional().isFloat({ min: 0 }).withMessage('Trip fuel must be a positive number'),
  body('contingencyFuel').optional().isFloat({ min: 0 }).withMessage('Contingency fuel must be a positive number'),
  body('blockFuel').optional().isFloat({ min: 0 }).withMessage('Block fuel must be a positive number'),
  body('finalReserve').optional().isFloat({ min: 0 }).withMessage('Final reserve fuel must be a positive number'),
  body('additionalFuel').optional().isFloat({ min: 0 }).withMessage('Additional fuel must be a positive number'),
  body('fuelForOtherSafetyRules').optional().isFloat({ min: 0 }).withMessage('Fuel for other safety rules must be a positive number'),
  body('discretionaryFuel').optional().isFloat({ min: 0 }).withMessage('Discretionary fuel must be a positive number'),
  body('extraFuel').optional().isFloat({ min: 0 }).withMessage('Extra fuel must be a positive number'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('economicTankeringCategory').optional().isString().withMessage('Economic tankering category must be a string'),
  body('alternateFuel').optional().isFloat({ min: 0 }).withMessage('Alternate fuel must be a positive number'),
  body('alternateArrivalAirport').optional().isString().withMessage('Alternate arrival airport must be a string'),
  body('fob').optional().isFloat({ min: 0 }).withMessage('FOB must be a positive number'),
  body('blockOn').optional().isFloat({ min: 0 }).withMessage('Block on must be a positive number'),
  body('blockOff').optional().isFloat({ min: 0 }).withMessage('Block off must be a positive number'),
  body('upliftVolume').optional().isFloat({ min: 0 }).withMessage('Uplift volume must be a positive number'),
  body('upliftDensity').optional().isFloat({ min: 0 }).withMessage('Uplift density must be a positive number'),
   
  body('pilotId').optional().isString().withMessage('Pilot ID must be a string')
];

const bulkFuelDataValidation = [
  body('fuels').isArray().withMessage('Data must be an array'),
  body('fuels.*.dateOfFlight').isISO8601().withMessage('Invalid flight date'),
  body('fuels.*.timeOfDeparture').notEmpty().withMessage('Departure time required'),
  body('fuels.*.flightNumber').notEmpty().withMessage('Flight number required'),
  body('fuels.*.departureAirport').notEmpty().withMessage('Departure airport required'),
  body('fuels.*.arrivalAirport').notEmpty().withMessage('Arrival airport required'),
  body('fuels.*.taxiFuel').optional().isFloat({ min: 0 }).withMessage('Taxi fuel must be a positive number'),
  body('fuels.*.tripFuel').optional().isFloat({ min: 0 }).withMessage('Trip fuel must be a positive number'),
  body('fuels.*.contingencyFuel').optional().isFloat({ min: 0 }).withMessage('Contingency fuel must be a positive number'),
  body('fuels.*.blockFuel').optional().isFloat({ min: 0 }).withMessage('Block fuel must be a positive number'),
  body('fuels.*.finalReserve').optional().isFloat({ min: 0 }).withMessage('Final reserve fuel must be a positive number'),
  body('fuels.*.additionalFuel').optional().isFloat({ min: 0 }).withMessage('Additional fuel must be a positive number'),
  body('fuels.*.fuelForOtherSafetyRules').optional().isFloat({ min: 0 }).withMessage('Fuel for other safety rules must be a positive number'),
  body('fuels.*.discretionaryFuel').optional().isFloat({ min: 0 }).withMessage('Discretionary fuel must be a positive number'),
  body('fuels.*.extraFuel').optional().isFloat({ min: 0 }).withMessage('Extra fuel must be a positive number'),
  body('fuels.*.reason').optional().isString().withMessage('Reason must be a string'),
  body('fuels.*.economicTankeringCategory').optional().isString().withMessage('Economic tankering category must be a string'),
  body('fuels.*.alternateFuel').optional().isFloat({ min: 0 }).withMessage('Alternate fuel must be a positive number'),
  body('fuels.*.alternateArrivalAirport').optional().isString().withMessage('Alternate arrival airport must be a string'),
  body('fuels.*.fob').optional().isFloat({ min: 0 }).withMessage('FOB must be a positive number'),
  body('fuels.*.blockOn').optional().isFloat({ min: 0 }).withMessage('Block on must be a positive number'),
  body('fuels.*.blockOff').optional().isFloat({ min: 0 }).withMessage('Block off must be a positive number'),
  body('fuels.*.upliftVolume').optional().isFloat({ min: 0 }).withMessage('Uplift volume must be a positive number'),
  body('fuels.*.upliftDensity').optional().isFloat({ min: 0 }).withMessage('Uplift density must be a positive number'),
   
  body('fuels.*.pilotId').optional().isString().withMessage('Pilot ID must be a string')
];

router.use(authMiddleware);
router.post(
  '/',
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
   // 👉 ajoute ici
  fuelDataValidation,
  fuelDataController.createFuelData
);
router.get('/', fuelDataController.getAllFuelData);

router.get('/:id', fuelDataController.getFuelData);

router.put(
  '/:id',
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
  // 👉 ici aussi
  fuelDataValidation,
  fuelDataController.updateFuelData
);

router.delete(
  '/:id',
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
  fuelDataController.deleteFuelData
);

router.post(
  '/bulk',
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
   
  bulkFuelDataValidation,
  fuelDataController.bulkCreateFuelData
);router.post(
  '/update-by-flight',
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
  async (req, res) => {
    try {
      const { flightNumber, ...updateData } = req.body;
      if (!flightNumber) {
        return res.status(400).json({ success: false, message: 'flightNumber is required' });
      }
      const fuelData = await FuelData.findOneAndUpdate(
        { flightNumber },
        updateData,
        { new: true, upsert: true, runValidators: true }
      );
      res.json({ success: true, message: 'Fuel data updated successfully', data: fuelData });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error updating fuel data', error: error.message });
    }
  }
);

module.exports = router;
module.exports.bulkFuelDataValidation = bulkFuelDataValidation;