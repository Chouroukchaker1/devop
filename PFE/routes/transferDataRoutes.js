const express = require('express');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { parse, format, isValid } = require('date-fns');
const FuelData = require('../models/FeulData'); // Note: Fix typo in model name if necessary (should be FuelData)
const FlightData = require('../models/flightDataModel');
const Notification = require('../models/Notification');
const SchedulerHistory = require('../models/SchedulerHistory');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { checkRole } = require('../middlewares/roleMiddleware');
const { body, validationResult } = require('express-validator');
const ExcelJS = require('exceljs'); // Added for streaming large Excel files
 
// ⛽ chemin vers le fichier où il est défini

const router = express.Router();

// File paths (relative to project root)
const FUEL_DATA_PATH = path.join(__dirname, '..', 'datax', 'data', 'all_fuel_data.xlsx');
const FLIGHT_DATA_PATH = path.join(__dirname, '..', 'sample_data', 'dataRaportProcessed.xlsx');
const MERGED_DATA_PATH = path.join(__dirname, '..', 'megred_data.xlsx');

// Helper to read Excel file (with streaming for large files)
const readExcelFile = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet(1);
  const data = [];

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row
    data.push(row.values.reduce((obj, val, idx) => {
      obj[worksheet.getRow(1).values[idx] || `col${idx}`] = val;
      return obj;
    }, {}));
  });

  if (data.length > 0) {
    console.log(`Columns detected in ${filePath}:`, Object.keys(data[0]));
  } else {
    console.log(`No data found in ${filePath}`);
  }

  return data;
};

// Helper to clear Excel file by creating an empty workbook
const clearExcelFile = (filePath) => {
  try {
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet([]);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
    xlsx.writeFile(workbook, filePath);
    console.log(`✅ Cleared Excel file: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error clearing Excel file ${filePath}: ${error.message}`);
    throw error;
  }
};

// Helper to populate Excel file with data
const populateExcelFile = (filePath, data, sheetName = 'Sheet1') => {
  try {
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
    xlsx.writeFile(workbook, filePath);
    console.log(`✅ Populated Excel file: ${filePath} with ${data.length} records`);
  } catch (error) {
    console.error(`❌ Error populating Excel file ${filePath}: ${error.message}`);
    throw error;
  }
};

// Normalize fuel data
const normalizeFuelData = (data) => {
  if (!data || data.length === 0) {
    console.warn('No fuel data to normalize');
    return [];
  }

  console.log(`Processing ${data.length} fuel data records`);
  console.log('Sample raw data:', data[0]);

  return data.map((item, index) => {
    let dateOfFlight = item['Date of Flight'] || item['dateOfFlight'] || '';
    if (dateOfFlight) {
      try {
        const parsedDate = parse(dateOfFlight, 'dd/MM/yyyy', new Date());
        if (isValid(parsedDate)) {
          dateOfFlight = format(parsedDate, 'yyyy-MM-dd');
        } else {
          console.warn(`Invalid date at record ${index + 1}: ${dateOfFlight}`);
          dateOfFlight = format(new Date(), 'yyyy-MM-dd');
        }
      } catch (error) {
        console.warn(`Date conversion error at record ${index + 1}: ${dateOfFlight}, error: ${error.message}`);
        dateOfFlight = format(new Date(), 'yyyy-MM-dd');
      }
    } else {
      dateOfFlight = format(new Date(), 'yyyy-MM-dd');
      console.log(`Default date assigned to record ${index + 1}: ${dateOfFlight}`);
    }

    const normalizedRecord = {
      dateOfFlight,
      timeOfDeparture: item['Time of Departure'] || item['timeOfDeparture'] || '',
      flightNumber: item['Flight Number'] || item['flightNumber'] || `FLIGHT-${index + 1000}`,
      departureAirport: item['DepartureAirport'] || item['departureAirport'] || 'DEFAULT_AIRPORT',
      arrivalAirport: item['ArrivalAirport'] || item['arrivalAirport'] || 'DEFAULT_AIRPORT',
      taxiFuel: Number(item['TaxiFuel'] || item['taxiFuel'] || 0),
      tripFuel: Number(item['TripFuel'] || item['tripFuel'] || 0),
      contingencyFuel: Number(item['ContingencyFuel'] || item['contingencyFuel'] || 0),
      blockFuel: Number(item['BlockFuel'] || item['blockFuel'] || 0),
      finalReserve: Number(item['FinalReserveFuel'] || item['finalReserve'] || 0),
      additionalFuel: Number(item['AdditionalFuel'] || item['additionalFuel'] || 0),
      fuelForOtherSafetyRules: Number(item['Fuel for other safety rules (tonnes)'] || item['fuelForOtherSafetyRules'] || 0),
      discretionaryFuel: Number(item['DiscretionaryFuel'] || item['discretionaryFuel'] || 0),
      extraFuel: Number(item['ExtraFuel'] || item['extraFuel'] || 0),
      reason: String(item['Reason'] || item['reason'] || ''),
      economicTankeringCategory: String(item['TankeringCategory'] || item['economicTankeringCategory'] || ''),
      alternateFuel: Number(item['AlternateFuel'] || item['alternateFuel'] || 0),
      alternateArrivalAirport: String(item['AlternateArrivalAirport'] || item['alternateArrivalAirport'] || ''),
      fob: Number(item['FOB'] || item['fob'] || 0),
      blockOn: Number(item['Block On (tonnes)'] || item['blockOn'] || 0),
      blockOff: Number(item['Block Off (tonnes)'] || item['blockOff'] || 0),
      upliftVolume: Number(item['Uplift Volume (Litres)'] || item['upliftVolume'] || 0),
      upliftDensity: Number(item['Uplift density'] || item['upliftDensity'] || 0),
       


      pilotId: String(item['pilotId'] || '')
    };

    console.log(`Normalized record ${index + 1}:`, normalizedRecord);
    return normalizedRecord;
  });
};

// Normalize flight data
const normalizeFlightData = (data) => {
  if (!data || data.length === 0) {
    console.warn('No flight data to normalize');
    return [];
  }

  console.log(`Processing ${data.length} flight data records`);
  const usedFlightIDs = new Set();

  return data.map((item, index) => {
    let dateOfOperationUTC = '';
    const possibleDateColumns = ['Date of operation (UTC)', 'dateOfOperationUTC', 'Date'];

    for (const dateCol of possibleDateColumns) {
      if (item[dateCol]) {
        try {
          let parsedDate;
          if (typeof item[dateCol] === 'string' && item[dateCol].includes('/')) {
            parsedDate = parse(item[dateCol], 'dd/MM/yyyy', new Date());
          } else if (typeof item[dateCol] === 'string' && item[dateCol].includes('-')) {
            parsedDate = parse(item[dateCol], 'yyyy-MM-dd', new Date());
          } else if (item[dateCol] instanceof Date) {
            parsedDate = item[dateCol];
          }

          if (parsedDate && isValid(parsedDate)) {
            dateOfOperationUTC = format(parsedDate, 'yyyy-MM-dd');
            break;
          }
        } catch (error) {
          console.warn(`Date conversion error for ${item[dateCol]} at record ${index + 1}: ${error.message}`);
        }
      }
    }

    if (!dateOfOperationUTC) {
      dateOfOperationUTC = format(new Date(), 'yyyy-MM-dd');
      console.log(`Default date assigned to record ${index + 1}: ${dateOfOperationUTC}`);
    }

    let flightID = String(item['Flight ID'] || item['flightID'] || `FLIGHT-${index + 1000}`).trim();
    if (usedFlightIDs.has(flightID)) {
      const timestamp = Date.now();
      flightID = `${flightID}-${timestamp}-${index}`;
      console.log(`Duplicate flightID detected, new ID: ${flightID}`);
    }
    usedFlightIDs.add(flightID);

    return {
      dateOfOperationUTC,
      acRegistration: String(item['AC registration'] || item['acRegistration'] || `REG-${index + 1000}`).trim(),
      flightID,
      icaoCallSign: String(item['ICAO Call sign'] || item['icaoCallSign'] || `CALL-${flightID}`).trim(),
      acType: String(item['AC Type'] || item['acType'] || 'DEFAULT-TYPE').trim(),
      company: String(item['company'] || item['Cie'] || 'DEFAULT-COMPANY').trim(),
      flightType: String(item['Flight type'] || item['flightType'] || 'REGULAR').trim(),
      departingAirportICAOCode: String(item['Departing Airport ICAO Code'] || item['departingAirportICAOCode'] || 'LFPG').trim(),
      departureTimeUTC: item['Departure Time/ Block-off time (UTC)'] || item['departureTimeUTC'] || '12:00',
      destinationAirportICAOCode: String(item['Destination Airport ICAO Code'] || item['destinationAirportICAOCode'] || 'LFPO').trim(),
      arrivalTimeUTC: item['Arrival Time/ Block-on Time(UTC)'] || item['arrivalTimeUTC'] || '14:00',
      upliftVolumeLitres: Number(item['Uplift Volume (Litres)'] || item['upliftVolumeLitres'] || 0),
      upliftDensity: Number(item['Uplift density'] || item['upliftDensity'] || 0.8),
      blockOnTonnes: Number(item['Block On (tonnes)'] || item['blockOnTonnes'] || 0),
      blockOffTonnes: Number(item['Block Off (tonnes)'] || item['blockOffTonnes'] || 0),
    };
  });
};

// Check and fix duplicate flight IDs
const checkAndFixDuplicateFlightIDs = async (normalizedFlightData) => {
  if (!normalizedFlightData || normalizedFlightData.length === 0) {
    return normalizedFlightData;
  }

  try {
    const existingFlightIDs = await FlightData.find({
      flightID: { $in: normalizedFlightData.map(data => data.flightID) }
    }).distinct('flightID');

    const existingIDSet = new Set(existingFlightIDs);
    const usedIDs = new Set();

    return normalizedFlightData.map((item, index) => {
      let flightID = item.flightID;
      if (existingIDSet.has(flightID) || usedIDs.has(flightID)) {
        const timestamp = Date.now();
        flightID = `${flightID}-${timestamp}-${index}`;
        console.log(`Corrected duplicate flightID: ${item.flightID} -> ${flightID}`);
        return { ...item, flightID };
      }
      usedIDs.add(flightID);
      return item;
    });
  } catch (error) {
    console.error(`Error checking duplicate flightIDs: ${error.message}`);
    throw error;
  }
};

// Validation for fuel data
const fuelDataValidation = [
  body('dateOfFlight').isISO8601().withMessage('Invalid Date of Flight'),
  body('timeOfDeparture').notEmpty().withMessage('Time of Departure required'),
  body('flightNumber').notEmpty().withMessage('Flight Number required'),
  body('departureAirport').notEmpty().withMessage('Departure Airport required'),
  body('arrivalAirport').notEmpty().withMessage('Arrival Airport required'),
  body('taxiFuel').optional().isFloat({ min: 0 }).withMessage('TaxiFuel must be a positive number'),
  body('tripFuel').optional().isFloat({ min: 0 }).withMessage('TripFuel must be a positive number'),
  body('contingencyFuel').optional().isFloat({ min: 0 }).withMessage('ContingencyFuel must be a positive number'),
  body('blockFuel').optional().isFloat({ min: 0 }).withMessage('BlockFuel must be a positive number'),
  body('finalReserve').optional().isFloat({ min: 0 }).withMessage('FinalReserve must be a positive number'),
  body('additionalFuel').optional().isFloat({ min: 0 }).withMessage('Additional Fuel must be a positive number'),
  body('discretionaryFuel').optional().isFloat({ min: 0 }).withMessage('Discretionary Fuel must be a positive number'),
  body('extraFuel').optional().isFloat({ min: 0 }).withMessage('Extra Fuel must be a positive number'),
  body('reason').optional().isString().withMessage('Reason must be a string'),
  body('economicTankeringCategory').optional().isString().withMessage('Economic tankering category must be a string'),
  body('alternateFuel').optional().isFloat({ min: 0 }).withMessage('AlternateFuel must be a positive number'),
  body('alternateArrivalAirport').optional().isString().withMessage('Alternate Arrival Airport must be a string'),
  body('fob').optional().isFloat({ min: 0 }).withMessage('FOB must be a positive number'),
  body('blockOn').optional().isFloat({ min: 0 }).withMessage('blockOn must be a positive number'),
  body('blockOff').optional().isFloat({ min: 0 }).withMessage('blockOff must be a positive number'),
  body('upliftVolume').optional().isFloat({ min: 0 }).withMessage('upliftVolume must be a positive number'),
  body('upliftDensity').optional().isFloat({ min: 0 }).withMessage('upliftDensity must be a positive number'),
 
  body('pilotId').optional().isString().withMessage('pilotId must be a string'),
];

// Validation for flight data
const flightDataValidation = [
  body('dateOfOperationUTC').isISO8601().withMessage('Invalid Date of Operation'),
  body('flightID').notEmpty().withMessage('Flight ID required'),
  body('acRegistration').notEmpty().withMessage('AC Registration required'),
  body('icaoCallSign').notEmpty().withMessage('ICAO Call Sign required'),
  body('acType').notEmpty().withMessage('AC Type required'),
  body('flightType').notEmpty().withMessage('Flight Type required'),
  body('departingAirportICAOCode').notEmpty().withMessage('Departing Airport ICAO Code required'),
  body('departureTimeUTC').notEmpty().withMessage('Departure Time UTC required'),
  body('destinationAirportICAOCode').notEmpty().withMessage('Destination Airport ICAO Code required'),
  body('arrivalTimeUTC').notEmpty().withMessage('Arrival Time UTC required'),
  body('upliftVolumeLitres').optional().isFloat({ min: 0 }).withMessage('Uplift Volume must be a positive number'),
  body('upliftDensity').optional().isFloat({ min: 0 }).withMessage('Uplift Density must be a positive number'),
  body('blockOnTonnes').optional().isFloat({ min: 0 }).withMessage('Block On Tonnes must be a positive number'),
  body('blockOffTonnes').optional().isFloat({ min: 0 }).withMessage('Block Off Tonnes must be a positive number'),
];

// Helper to compare arrays of objects
const compareData = (oldData, newData, keyFields) => {
  const newRecords = [];
  const oldDataMap = new Map();

  oldData.forEach(item => {
    const key = keyFields.map(field => item[field]).join('-');
    oldDataMap.set(key, item);
  });

  newData.forEach(item => {
    const key = keyFields.map(field => item[field]).join('-');
    if (!oldDataMap.has(key)) {
      newRecords.push(item);
    } else {
      const oldItem = oldDataMap.get(key);
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

// Route to extract and transfer fuel data
router.post(
  '/extract-and-transfer-fuel',
  authMiddleware,
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
   
  async (req, res) => {
    console.log('✅ Route POST /api/transfer/extract-and-transfer-fuel reached');
    try {
      // Read fuel Excel file
      console.log('Reading fuel Excel file...');
      let fuelDataRaw;
      try {
        fuelDataRaw = await readExcelFile(FUEL_DATA_PATH);
        console.log(`Fuel data file read with ${fuelDataRaw.length} records`);
      } catch (error) {
        console.error(`Error reading fuel data file: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: `Error reading fuel data file: ${error.message}`
        });
      }

      // Normalize fuel data
      console.log('Normalizing fuel data...');
      const normalizedFuelData = normalizeFuelData(fuelDataRaw);

      // Check if data is available
      if (normalizedFuelData.length === 0) {
        console.warn('No valid fuel data after normalization');
        return res.status(400).json({
          success: false,
          message: 'No valid fuel data after normalization. Check the Excel file format.',
        });
      }

      // Validate fuel data
      console.log('Validating fuel data...');
      const invalidFuelEntries = normalizedFuelData.filter(
        data => !data.flightNumber || !data.dateOfFlight || !data.departureAirport || !data.timeOfDeparture
      );

      if (invalidFuelEntries.length > 0) {
        console.log('Invalid fuel entries:', invalidFuelEntries);
        return res.status(400).json({
          success: false,
          message: 'Invalid fuel data detected',
          invalidEntries: invalidFuelEntries.map((d, idx) => ({
            index: idx,
            flightNumber: d.flightNumber,
            dateOfFlight: d.dateOfFlight,
            departureAirport: d.departureAirport,
            timeOfDeparture: d.timeOfDeparture
          }))
        });
      }

      // Check duplicates for fuel data
      console.log('Checking duplicates for fuel data...');
      try {
        const existingFuelRecords = await FuelData.find({
          $or: normalizedFuelData.map((data) => ({
            flightNumber: data.flightNumber,
            dateOfFlight: data.dateOfFlight,
            timeOfDeparture: data.timeOfDeparture,
          })),
        }).select('flightNumber dateOfFlight timeOfDeparture');

        const existingFuelKeys = existingFuelRecords.map(
          (record) => `${record.flightNumber}-${record.dateOfFlight}-${record.timeOfDeparture}`
        );
        const duplicateFuelRecords = normalizedFuelData.filter((data) =>
          existingFuelKeys.includes(`${data.flightNumber}-${data.dateOfFlight}-${data.timeOfDeparture}`)
        );

        if (duplicateFuelRecords.length > 0) {
          console.log('Fuel duplicates detected:', duplicateFuelRecords);
          return res.status(400).json({
            success: false,
            message: 'Duplicates found for fuel data',
            duplicates: duplicateFuelRecords.map((d) => ({
              flightNumber: d.flightNumber,
              dateOfFlight: d.dateOfFlight,
              timeOfDeparture: d.timeOfDeparture,
            })),
          });
        }
      } catch (dbError) {
        console.error('Error checking fuel duplicates:', dbError);
        return res.status(500).json({
          success: false,
          message: `Error checking fuel duplicates: ${dbError.message}`
        });
      }

      // Insert fuel data
      console.log('Inserting fuel data...');
      let insertedFuelData = [];
      try {
        insertedFuelData = await FuelData.insertMany(normalizedFuelData, { ordered: false });
        console.log(`${insertedFuelData.length} fuel records inserted successfully`);
      } catch (insertError) {
        console.error('Error inserting fuel data:', insertError);
        return res.status(500).json({
          success: false,
          message: `Error inserting fuel data: ${insertError.message}`,
          details: insertError.errors || insertError
        });
      }

      // Clear fuel Excel file
      console.log('Clearing fuel Excel file...');
      try {
        clearExcelFile(FUEL_DATA_PATH);
      } catch (clearError) {
        console.warn(`Warning: Failed to clear fuel Excel file: ${clearError.message}`);
      }

      // Create notification
      console.log('Creating notification...');
      try {
        const notification = new Notification({
          userId: req.user._id,
          message: `Fuel data extracted and transferred: ${insertedFuelData.length} fuel records. Source Excel file cleared.`,
          read: false,
        });
        await notification.save();
      } catch (notifError) {
        console.warn(`Notification not created: ${notifError.message}`);
      }

      // Respond with success
      console.log('Fuel transfer completed successfully');
      res.status(201).json({
        success: true,
        message: `Fuel data transferred successfully: ${insertedFuelData.length} fuel records. Source Excel file cleared.`,
        fuelCount: insertedFuelData.length,
      });
    } catch (error) {
      console.error('❌ Global error in /extract-and-transfer-fuel:', error);
      res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`,
        details: error.stack
      });
    }
  }
);

// Route to extract and transfer flight data
router.post(
  '/extract-and-transfer-flight',
  authMiddleware,
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
  async (req, res) => {
    console.log('✅ Route POST /api/transfer/extract-and-transfer-flight reached');
    try {
      // Read flight Excel file
      console.log('Reading flight Excel file...');
      let flightDataRaw;
      try {
        flightDataRaw = await readExcelFile(FLIGHT_DATA_PATH);
        console.log(`Flight data file read with ${flightDataRaw.length} records`);
      } catch (error) {
        console.error(`Error reading flight data file: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: `Error reading flight data file: ${error.message}`
        });
      }

      // Normalize flight data
      console.log('Normalizing flight data...');
      let normalizedFlightData = normalizeFlightData(flightDataRaw);

      // Check if data is available
      if (normalizedFlightData.length === 0) {
        console.warn('No valid flight data after normalization');
        return res.status(400).json({
          success: false,
          message: 'No valid flight data after normalization. Check the Excel file format.',
        });
      }

      // Validate flight data
      console.log('Validating flight data...');
      const invalidFlightEntries = normalizedFlightData.filter(data => {
        return !data.dateOfOperationUTC ||
               !data.flightID ||
               !data.acRegistration ||
               !data.icaoCallSign ||
               !data.acType ||
               !data.flightType ||
               !data.departingAirportICAOCode ||
               !data.departureTimeUTC ||
               !data.destinationAirportICAOCode ||
               !data.arrivalTimeUTC;
      });

      if (invalidFlightEntries.length > 0) {
        console.log('Invalid flight entries:', invalidFlightEntries);
        return res.status(400).json({
          success: false,
          message: 'Invalid flight data detected',
          invalidEntries: invalidFlightEntries.map((d, idx) => ({
            index: idx,
            flightID: d.flightID,
            dateOfOperationUTC: d.dateOfOperationUTC
          }))
        });
      }

      // Check and fix duplicates for flight data
      console.log('Checking duplicates for flight data...');
      try {
        normalizedFlightData = await checkAndFixDuplicateFlightIDs(normalizedFlightData);
      } catch (dbError) {
        console.error('Error checking flight duplicates:', dbError);
        return res.status(500).json({
          success: false,
          message: `Error checking flight duplicates: ${dbError.message}`
        });
      }

      // Insert flight data
      console.log('Inserting flight data...');
      let insertedFlightData = [];
      try {
        insertedFlightData = await FlightData.insertMany(normalizedFlightData, { ordered: false });
        console.log(`${insertedFlightData.length} flight records inserted successfully`);
      } catch (insertError) {
        console.error('Error inserting flight data:', insertError);
        return res.status(500).json({
          success: false,
          message: `Error inserting flight data: ${insertError.message}`,
          details: insertError.errors || insertError
        });
      }

      // Clear flight Excel file
      console.log('Clearing flight Excel file...');
      try {
        clearExcelFile(FLIGHT_DATA_PATH);
      } catch (clearError) {
        console.warn(`Warning: Failed to clear flight Excel file: ${clearError.message}`);
      }

      // Create notification
      console.log('Creating notification...');
      try {
        const notification = new Notification({
          userId: req.user._id,
          message: `Flight data extracted and transferred: ${insertedFlightData.length} flight records. Source Excel file cleared.`,
          read: false,
        });
        await notification.save();
      } catch (notifError) {
        console.warn(`Notification not created: ${notifError.message}`);
      }

      // Respond with success
      console.log('Flight transfer completed successfully');
      res.status(201).json({
        success: true,
        message: `Flight data transferred successfully: ${insertedFlightData.length} flight records. Source Excel file cleared.`,
        flightCount: insertedFlightData.length,
      });
    } catch (error) {
      console.error('❌ Global error in /extract-and-transfer-flight:', error);
      res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`,
        details: error.stack
      });
    }
  }
);

// New generic route to extract and transfer data
router.post(
  '/extract-and-transfer',
  authMiddleware,
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
  [
    body('dataType').isIn(['fuel', 'flight']).withMessage('dataType must be either "fuel" or "flight"'),
  ],
  async (req, res) => {
    console.log('✅ Route POST /api/transfer/extract-and-transfer reached');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { dataType } = req.body;

    try {
      let filePath, normalizedData, Model;
      if (dataType === 'fuel') {
        filePath = FUEL_DATA_PATH;
        Model = FuelData;
      } else if (dataType === 'flight') {
        filePath = FLIGHT_DATA_PATH;
        Model = FlightData;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid dataType. Must be "fuel" or "flight".'
        });
      }

      // Read Excel file
      console.log(`Reading ${dataType} Excel file...`);
      let rawData;
      try {
        rawData = await readExcelFile(filePath);
        console.log(`${dataType} data file read with ${rawData.length} records`);
      } catch (error) {
        console.error(`Error reading ${dataType} data file: ${error.message}`);
        return res.status(500).json({
          success: false,
          message: `Error reading ${dataType} data file: ${error.message}`
        });
      }

      // Normalize data
      console.log(`Normalizing ${dataType} data...`);
      if (dataType === 'fuel') {
        normalizedData = normalizeFuelData(rawData);
      } else {
        normalizedData = normalizeFlightData(rawData);
      }

      if (normalizedData.length === 0) {
        console.warn(`No valid ${dataType} data after normalization`);
        return res.status(400).json({
          success: false,
          message: `No valid ${dataType} data after normalization. Check the Excel file format.`
        });
      }

      // Validate data
      console.log(`Validating ${dataType} data...`);
      let invalidEntries = [];
      if (dataType === 'fuel') {
        invalidEntries = normalizedData.filter(
          data => !data.flightNumber || !data.dateOfFlight || !data.departureAirport || !data.timeOfDeparture
        );
      } else {
        invalidEntries = normalizedData.filter(data => {
          return !data.dateOfOperationUTC ||
                 !data.flightID ||
                 !data.acRegistration ||
                 !data.icaoCallSign ||
                 !data.acType ||
                 !data.flightType ||
                 !data.departingAirportICAOCode ||
                 !data.departureTimeUTC ||
                 !data.destinationAirportICAOCode ||
                 !data.arrivalTimeUTC;
        });
      }

      if (invalidEntries.length > 0) {
        console.log(`Invalid ${dataType} entries:`, invalidEntries);
        return res.status(400).json({
          success: false,
          message: `Invalid ${dataType} data detected`,
          invalidEntries: invalidEntries.map((d, idx) => ({
            index: idx,
            keyField: dataType === 'fuel' ? d.flightNumber : d.flightID
          }))
        });
      }

      // Check duplicates
      console.log(`Checking duplicates for ${dataType} data...`);
      if (dataType === 'fuel') {
        const existingFuelRecords = await FuelData.find({
          $or: normalizedData.map((data) => ({
            flightNumber: data.flightNumber,
            dateOfFlight: data.dateOfFlight,
            timeOfDeparture: data.timeOfDeparture,
          })),
        }).select('flightNumber dateOfFlight timeOfDeparture');

        const existingFuelKeys = existingFuelRecords.map(
          (record) => `${record.flightNumber}-${record.dateOfFlight}-${record.timeOfDeparture}`
        );
        const duplicateFuelRecords = normalizedData.filter((data) =>
          existingFuelKeys.includes(`${data.flightNumber}-${data.dateOfFlight}-${data.timeOfDeparture}`)
        );

        if (duplicateFuelRecords.length > 0) {
          console.log('Fuel duplicates detected:', duplicateFuelRecords);
          return res.status(400).json({
            success: false,
            message: 'Duplicates found for fuel data',
            duplicates: duplicateFuelRecords.map((d) => ({
              flightNumber: d.flightNumber,
              dateOfFlight: d.dateOfFlight,
              timeOfDeparture: d.timeOfDeparture,
            })),
          });
        }
      } else {
        normalizedData = await checkAndFixDuplicateFlightIDs(normalizedData);
      }

      // Insert data
      console.log(`Inserting ${dataType} data...`);
      let insertedData;
      try {
        insertedData = await Model.insertMany(normalizedData, { ordered: false });
        console.log(`${insertedData.length} ${dataType} records inserted successfully`);
      } catch (insertError) {
        console.error(`Error inserting ${dataType} data:`, insertError);
        return res.status(500).json({
          success: false,
          message: `Error inserting ${dataType} data: ${insertError.message}`,
          details: insertError.errors || insertError
        });
      }

      // Clear Excel file
      console.log(`Clearing ${dataType} Excel file...`);
      try {
        clearExcelFile(filePath);
      } catch (clearError) {
        console.warn(`Warning: Failed to clear ${dataType} Excel file: ${clearError.message}`);
      }

      // Create notification
      console.log('Creating notification...');
      try {
        const notification = new Notification({
          userId: req.user._id,
          message: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} data extracted and transferred: ${insertedData.length} records. Source Excel file cleared.`,
          read: false,
        });
        await notification.save();
      } catch (notifError) {
        console.warn(`Notification not created: ${notifError.message}`);
      }

      // Respond with success
      console.log(`${dataType} transfer completed successfully`);
      res.status(201).json({
        success: true,
        message: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} data transferred successfully: ${insertedData.length} records. Source Excel file cleared.`,
        count: insertedData.length,
      });
    } catch (error) {
      console.error(`❌ Global error in /extract-and-transfer for ${dataType}:`, error);
      res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`,
        details: error.stack
      });
    }
  }
);

// Route to transfer new fuel or flight data
router.post(
  '/extract-and-transfer-new-data',
  authMiddleware,
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
  [
    body('dataType').isIn(['fuel', 'flight']).withMessage('dataType must be either "fuel" or "flight"'),
    body('records').isArray().withMessage('records must be an array'),
    body('records').notEmpty().withMessage('records array cannot be empty'),
  ],
  async (req, res) => {
    console.log('✅ Route POST /api/transfer/extract-and-transfer-new-data reached');
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { dataType, records } = req.body;

    try {
      let normalizedData = [];
      let insertedData = [];
      let Model, filePath;

      if (dataType === 'fuel') {
        console.log('Normalizing fuel data...');
        normalizedData = normalizeFuelData(records);
        Model = FuelData;
        filePath = FUEL_DATA_PATH;

        // Validate fuel data
        const invalidFuelEntries = normalizedData.filter(
          data => !data.flightNumber || !data.dateOfFlight || !data.departureAirport || !data.timeOfDeparture
        );

        if (invalidFuelEntries.length > 0) {
          console.log('Invalid fuel entries:', invalidFuelEntries);
          return res.status(400).json({
            success: false,
            message: 'Invalid fuel data detected',
            invalidEntries: invalidFuelEntries.map((d, idx) => ({
              index: idx,
              flightNumber: d.flightNumber,
              dateOfFlight: d.dateOfFlight,
              departureAirport: d.departureAirport,
              timeOfDeparture: d.timeOfDeparture
            }))
          });
        }

        // Check duplicates
        const existingFuelRecords = await FuelData.find({
          $or: normalizedData.map((data) => ({
            flightNumber: data.flightNumber,
            dateOfFlight: data.dateOfFlight,
            timeOfDeparture: data.timeOfDeparture,
          })),
        }).select('flightNumber dateOfFlight timeOfDeparture');

        const existingFuelKeys = existingFuelRecords.map(
          (record) => `${record.flightNumber}-${record.dateOfFlight}-${record.timeOfDeparture}`
        );
        const duplicateFuelRecords = normalizedData.filter((data) =>
          existingFuelKeys.includes(`${data.flightNumber}-${data.dateOfFlight}-${data.timeOfDeparture}`)
        );

        if (duplicateFuelRecords.length > 0) {
          console.log('Fuel duplicates detected:', duplicateFuelRecords);
          return res.status(400).json({
            success: false,
            message: 'Duplicates found for fuel data',
            duplicates: duplicateFuelRecords.map((d) => ({
              flightNumber: d.flightNumber,
              dateOfFlight: d.dateOfFlight,
              timeOfDeparture: d.timeOfDeparture,
            })),
          });
        }
      } else if (dataType === 'flight') {
        console.log('Normalizing flight data...');
        normalizedData = normalizeFlightData(records);
        Model = FlightData;
        filePath = FLIGHT_DATA_PATH;

        // Validate flight data
        const invalidFlightEntries = normalizedData.filter(data => {
          return !data.dateOfOperationUTC ||
                 !data.flightID ||
                 !data.acRegistration ||
                 !data.icaoCallSign ||
                 !data.acType ||
                 !data.flightType ||
                 !data.departingAirportICAOCode ||
                 !data.departureTimeUTC ||
                 !data.destinationAirportICAOCode ||
                 !data.arrivalTimeUTC;
        });

        if (invalidFlightEntries.length > 0) {
          console.log('Invalid flight entries:', invalidFlightEntries);
          return res.status(400).json({
            success: false,
            message: 'Invalid flight data detected',
            invalidEntries: invalidFlightEntries.map((d, idx) => ({
              index: idx,
              flightID: d.flightID,
              dateOfOperationUTC: d.dateOfOperationUTC
            }))
          });
        }

        // Check and fix duplicates
        normalizedData = await checkAndFixDuplicateFlightIDs(normalizedData);
      }

      // Insert data
      console.log(`Inserting ${dataType} data...`);
      try {
        insertedData = await Model.insertMany(normalizedData, { ordered: false });
        console.log(`${insertedData.length} ${dataType} records inserted successfully`);
      } catch (insertError) {
        console.error(`Error inserting ${dataType} data:`, insertError);
        return res.status(500).json({
          success: false,
          message: `Error inserting ${dataType} data: ${insertError.message}`,
          details: insertError.errors || insertError
        });
      }

      // Clear Excel file (optional)
      console.log(`Clearing ${dataType} Excel file...`);
      try {
        clearExcelFile(filePath);
      } catch (clearError) {
        console.warn(`Warning: Failed to clear ${dataType} Excel file: ${clearError.message}`);
      }

      // Create notification
      console.log('Creating notification...');
      try {
        const notification = new Notification({
          userId: req.user._id,
          message: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} data extracted and transferred: ${insertedData.length} records. Source Excel file cleared.`,
          read: false,
        });
        await notification.save();
      } catch (notifError) {
        console.warn(`Notification not created: ${notifError.message}`);
      }

      // Respond with success
      console.log(`${dataType} transfer completed successfully`);
      res.status(201).json({
        success: true,
        message: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} data transferred successfully: ${insertedData.length} records. Source Excel file cleared.`,
        count: insertedData.length,
      });
    } catch (error) {
      console.error(`❌ Global error in /extract-and-transfer-new-data for ${dataType}:`, error);
      res.status(500).json({
        success: false,
        message: `Server error: ${error.message}`,
        details: error.stack
      });
    }
  }
);

// Route to compare data before and after scheduler
router.post(
  '/compare-data',
  authMiddleware,
  checkRole(['admin', 'fueldatamaster', 'fueluser']),
  async (req, res) => {
    console.log('✅ Route POST /api/transfer/compare-data reached');
    try {
      // Get the latest scheduler history
      const latestHistory = await SchedulerHistory.findOne()
        .sort({ startTime: -1 })
        .lean();

      if (!latestHistory) {
        return res.status(404).json({
          success: false,
          message: 'No scheduler history found. Scheduler has not run yet.'
        });
      }

      // Get data from database before scheduler
      const preSchedulerFuelData = await FuelData.find({
        createdAt: { $lt: latestHistory.startTime }
      }).lean();

      const preSchedulerFlightData = await FlightData.find({
        createdAt: { $lt: latestHistory.startTime }
      }).lean();

      // Get current data from database (after scheduler)
      const postSchedulerFuelData = await FuelData.find({
        createdAt: { $gte: latestHistory.startTime }
      }).lean();

      const postSchedulerFlightData = await FlightData.find({
        createdAt: { $gte: latestHistory.startTime }
      }).lean();

      // Read Excel files for additional comparison
      let fuelDataRaw = [];
      let flightDataRaw = [];
      try {
        fuelDataRaw = await readExcelFile(FUEL_DATA_PATH);
        flightDataRaw = await readExcelFile(FLIGHT_DATA_PATH);
      } catch (error) {
        console.warn(`Error reading Excel files: ${error.message}`);
      }

      // Compare fuel data
      const newFuelRecords = compareData(
        preSchedulerFuelData,
        postSchedulerFuelData,
        ['flightNumber', 'dateOfFlight', 'timeOfDeparture']
      );

      // Compare flight data
      const newFlightRecords = compareData(
        preSchedulerFlightData,
        postSchedulerFlightData,
        ['flightID', 'dateOfOperationUTC']
      );

      // Check if there are any new records
      if (newFuelRecords.length === 0 && newFlightRecords.length === 0) {
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

      // Create notification for new data
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

      // Respond with new records
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

// Download routes
router.get('/download/all_fuel_data', authMiddleware, (req, res) => {
  const filePath = FUEL_DATA_PATH;
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'all_fuel_data.xlsx', (err) => {
      if (err) {
        console.error('❌ Download error:', err.message);
        res.status(500).json({ success: false, message: 'Error downloading file.' });
      }
    });
  } else {
    console.error('❌ File does not exist at location.');
    res.status(404).json({ success: false, message: 'File not found.' });
  }
});

router.get('/download/megred-data', authMiddleware, (req, res) => {
  const filePath = MERGED_DATA_PATH;
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'megred_data.xlsx', (err) => {
      if (err) {
        console.error('❌ Download error:', err.message);
        res.status(500).json({ success: false, message: 'Error downloading file.' });
      }
    });
  } else {
    console.error('❌ File does not exist at location.');
    res.status(404).json({ success: false, message: 'File not found.' });
  }
});

router.get('/download/data-rapport-processed', authMiddleware, (req, res) => {
  const filePath = FLIGHT_DATA_PATH;
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'dataRaportProcessed.xlsx', (err) => {
      if (err) {
        console.error('❌ Download error:', err.message);
        res.status(500).json({ success: false, message: 'Error downloading file.' });
      }
    });
  } else {
    console.error('❌ File does not exist at location.');
    res.status(404).json({ success: false, message: 'File not found.' });
  }
});

module.exports = router;
module.exports.fuelDataValidation = fuelDataValidation;
module.exports.flightDataValidation = flightDataValidation;