const express = require('express');
const { body, validationResult } = require('express-validator');
const flightDataController = require('../controllers/flightDataController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');
const Notification = require('../models/Notification');

const router = express.Router();

const flightDataValidation = [
  body('*.dateOfOperationUTC').isISO8601().withMessage('Invalid date'),
  body('*.acRegistration').notEmpty().withMessage('AC Registration required'),
  body('*.flightID').notEmpty().withMessage('Flight ID required'),
  body('*.icaoCallSign').notEmpty().withMessage('ICAO Call Sign required'),
  body('*.acType').notEmpty().withMessage('AC Type required'),
  body('*.company').optional().isString().withMessage('Company must be a string'),
  body('*.flightType').notEmpty().withMessage('Flight Type required'),
  body('*.departingAirportICAOCode').notEmpty().withMessage('Departure airport required'),
  body('*.departureTimeUTC').notEmpty().withMessage('Departure time required'),
  body('*.destinationAirportICAOCode').notEmpty().withMessage('Destination airport required'),
  body('*.arrivalTimeUTC').notEmpty().withMessage('Arrival time required'),
  body('*.upliftVolumeLitres').optional({ nullable: true }).isNumeric().withMessage('Uplift volume must be numeric'),
  body('*.upliftDensity').optional({ nullable: true }).isNumeric().withMessage('Uplift density must be numeric'),
  body('*.blockOnTonnes').optional({ nullable: true }).isNumeric().withMessage('Block on tonnes must be numeric'),
  body('*.blockOffTonnes').optional({ nullable: true }).isNumeric().withMessage('Block off tonnes must be numeric')
];

router.use(authMiddleware);

router.post(
  '/',
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
  flightDataValidation,
  flightDataController.createFlightData
);

router.get('/', flightDataController.getAllFlights);

router.get('/:id', flightDataController.getFlightById);

router.put(
  '/:id',
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
  flightDataValidation,
  flightDataController.updateFlightData
);

router.delete(
  '/:id',
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
  flightDataController.deleteFlightData
);


module.exports = router;
module.exports.flightDataValidation = flightDataValidation;