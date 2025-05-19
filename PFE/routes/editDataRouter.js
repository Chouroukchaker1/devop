const express = require('express');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { authMiddleware } = require('../middlewares/authMiddleware');
const Notification = require('../models/Notification');

// Create router
const editDataRouter = express.Router();

// Excel file paths
const FUEL_DATA_PATH = 'C:/Users/lenovo/Desktop/PFE/datax/data/all_fuel_data.xlsx';
const FLIGHT_DATA_PATH = 'C:/Users/lenovo/Desktop/PFE/sample_data/dataRaportProcessed.xlsx';
const MERGED_DATA_PATH = 'C:/Users/lenovo/Desktop/PFE/megred_data.xlsx';

// Helper to read Excel file
const readExcelFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File ${filePath} does not exist`);
  }
  const workbook = xlsx.readFile(filePath);
  return {
    workbook,
    sheet: xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]])
  };
};

// Helper to write Excel file
const writeExcelFile = (filePath, data) => {
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.json_to_sheet(data);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  xlsx.writeFile(workbook, filePath);
};

// Helper to normalize date formats for comparison
const normalizeDateFormat = (dateString) => {
  if (!dateString) return '';
  return String(dateString).replace(/[-./]/g, '-');
};

// Helper to find record by Flight Number and Date of Flight
const findRecord = (data, flightNumber, dateOfFlight) => {
  const normalizedDateToFind = normalizeDateFormat(dateOfFlight);
  
  return data.find(record => {
    const recordFlightNum = String(record['Flight Number'] || record['Flight ID'] || '').trim();
    const recordDate = normalizeDateFormat(record['Date of Flight'] || record['Date of operation (UTC)'] || '');
    
    return recordFlightNum === String(flightNumber).trim() && 
           recordDate === normalizedDateToFind;
  });
};

// Route to get a specific record
editDataRouter.get('/:dataType', authMiddleware, async (req, res) => {
  try {
    const { dataType } = req.params;
    const { flightNumber, dateOfFlight } = req.query;
    
    if (!['fuel', 'flight', 'merged'].includes(dataType)) {
      return res.status(400).json({ success: false, message: 'Invalid data type' });
    }
    if (!flightNumber || !dateOfFlight) {
      return res.status(400).json({
        success: false,
        message: 'Flight number and date of flight are required query parameters'
      });
    }
    
    console.log(`GET /api/edit/${dataType} - flightNumber: ${flightNumber}, dateOfFlight: ${dateOfFlight}`);

    // Select file based on data type
    let filePath;
    switch (dataType) {
      case 'fuel':
        filePath = FUEL_DATA_PATH;
        break;
      case 'flight':
        filePath = FLIGHT_DATA_PATH;
        break;
      case 'merged':
        filePath = MERGED_DATA_PATH;
        break;
    }

    // Read Excel file
    const { sheet } = readExcelFile(filePath);

    // Find record
    const record = findRecord(sheet, flightNumber, dateOfFlight);

    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: `Record not found for flight ${flightNumber} on date ${dateOfFlight}` 
      });
    }

    res.json({ success: true, data: record });
  } catch (error) {
    console.error(`Error retrieving record: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route to update a specific record
editDataRouter.put('/:dataType', authMiddleware, async (req, res) => {
  try {
    const { dataType } = req.params;
    const { flightNumber, dateOfFlight } = req.query;
    const updatedData = req.body;
    
    if (!['fuel', 'flight', 'merged'].includes(dataType)) {
      return res.status(400).json({ success: false, message: 'Invalid data type' });
    }
    if (!flightNumber || !dateOfFlight) {
      return res.status(400).json({
        success: false,
        message: 'Flight number and date of flight are required query parameters'
      });
    }
    
    console.log(`PUT /api/edit/${dataType} - flightNumber: ${flightNumber}, dateOfFlight: ${dateOfFlight}, updatedData:`, updatedData);

    // Select file based on data type
    let filePath;
    switch (dataType) {
      case 'fuel':
        filePath = FUEL_DATA_PATH;
        break;
      case 'flight':
        filePath = FLIGHT_DATA_PATH;
        break;
      case 'merged':
        filePath = MERGED_DATA_PATH;
        break;
    }

    // Read Excel file
    const { sheet } = readExcelFile(filePath);

    // Find record index
    const normalizedDateToFind = normalizeDateFormat(dateOfFlight);
    
    const recordIndex = sheet.findIndex(record => {
      const recordFlightNum = String(record['Flight Number'] || record['Flight ID'] || '').trim();
      const recordDate = normalizeDateFormat(record['Date of Flight'] || record['Date of operation (UTC)'] || '');
      
      return recordFlightNum === String(flightNumber).trim() && 
             recordDate === normalizedDateToFind;
    });

    if (recordIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: `Record not found for flight ${flightNumber} on date ${dateOfFlight}` 
      });
    }

    // Update record
    const currentRecord = sheet[recordIndex];
    sheet[recordIndex] = { ...currentRecord, ...updatedData };

    // Write changes to Excel file
    writeExcelFile(filePath, sheet);

    // Create notification for the user
    const notification = new Notification({
      userId: req.user._id,
      message: `Data updated for flight ${flightNumber} on ${dateOfFlight} (${dataType})`,
      read: false
    });
    await notification.save();

    res.json({ success: true, message: 'Record updated successfully', data: sheet[recordIndex] });
  } catch (error) {
    console.error(`Error updating record: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route for bulk updates
editDataRouter.put('/:dataType/bulk', authMiddleware, async (req, res) => {
  try {
    const { dataType } = req.params;
    const { updates, conditions } = req.body;

    if (!['fuel', 'flight', 'merged'].includes(dataType)) {
      return res.status(400).json({ success: false, message: 'Invalid data type' });
    }

    console.log(`PUT /api/edit/${dataType}/bulk - updates:`, updates, 'conditions:', conditions);

    // Select file based on data type
    let filePath;
    switch (dataType) {
      case 'fuel':
        filePath = FUEL_DATA_PATH;
        break;
      case 'flight':
        filePath = FLIGHT_DATA_PATH;
        break;
      case 'merged':
        filePath = MERGED_DATA_PATH;
        break;
    }

    // Read Excel file
    const { sheet } = readExcelFile(filePath);
    
    // Apply conditions (if provided)
    let updatedRecords = 0;
    const updatedSheet = sheet.map(record => {
      // Check if record meets conditions
      let meetsConditions = true;
      if (conditions) {
        for (const [key, value] of Object.entries(conditions)) {
          if (String(record[key]) !== String(value)) {
            meetsConditions = false;
            break;
          }
        }
      }

      // Update record if conditions are met
      if (meetsConditions) {
        updatedRecords++;
        return { ...record, ...updates };
      }
      return record;
    });

    // Write changes to Excel file
    writeExcelFile(filePath, updatedSheet);

    // Create notification for the user
    const notification = new Notification({
      userId: req.user._id,
      message: `Bulk update performed on ${updatedRecords} records (${dataType})`,
      read: false
    });
    await notification.save();

    res.json({
      success: true,
      message: `Bulk update performed on ${updatedRecords} records`,
      updatedRecords
    });
  } catch (error) {
    console.error(`Error during bulk update: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = editDataRouter;