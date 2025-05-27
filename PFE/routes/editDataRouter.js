const express = require('express');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { exec } = require('child_process');
const util = require('util');
const { authMiddleware } = require('../middlewares/authMiddleware');
const Notification = require('../models/Notification');

// Promisify exec for async/await
const execPromise = util.promisify(exec);

// Create router
const editDataRouter = express.Router();

// Excel file paths
const FUEL_DATA_PATH = '/app/datax/data/all_fuel_data.xlsx';
const FLIGHT_DATA_PATH = '/app/sample_data/dataRaportProcessed.xlsx';
const MERGED_DATA_PATH = '/app/output/merged_data.xlsx';

// Helper to read Excel file
const readExcelFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Le fichier n'a pas été trouvé à l'emplacement : ${filePath}`);
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
        // Check if merged file exists; if not, run Python merge script
        if (!fs.existsSync(filePath)) {
          console.log('Merged file not found, running Python merge script...');
          try {
            await execPromise(`python3 /app/merge_script.py`);
            console.log('Python merge script executed successfully');
          } catch (error) {
            throw new Error(`Failed to generate merged file: ${error.message}`);
          }
        }
        break;
    }

    // Read Excel file
    console.log(`Attempting to read file at: ${filePath}`);
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

// Route to get all merged data (for /api/data/json/merged)
editDataRouter.get('/json/merged', authMiddleware, async (req, res) => {
  try {
    console.log(`GET /api/edit/json/merged`);

    // Check if merged file exists; if not, run Python merge script
    if (!fs.existsSync(MERGED_DATA_PATH)) {
      console.log('Merged file not found, running Python merge script...');
      try {
        await execPromise(`python3 /app/merge_script.py`);
        console.log('Python merge script executed successfully');
      } catch (error) {
        throw new Error(`Failed to generate merged file: ${error.message}`);
      }
    }

    // Read Excel file
    console.log(`Attempting to read file at: ${MERGED_DATA_PATH}`);
    const { sheet } = readExcelFile(MERGED_DATA_PATH);

    res.json({ success: true, data: sheet });
  } catch (error) {
    console.error(`Error retrieving merged data: ${error.message}`);
    res.status(500).json({ 
      success: false, 
      message: `Erreur lors de la lecture des données merged: ${error.message}` 
    });
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
        // Check if merged file exists; if not, run Python merge script
        if (!fs.existsSync(filePath)) {
          console.log('Merged file not found, running Python merge script...');
          try {
            await execPromise(`python3 /app/merge_script.py`);
            console.log('Python merge script executed successfully');
          } catch (error) {
            throw new Error(`Failed to generate merged file: ${error.message}`);
          }
        }
        break;
    }

    // Read Excel file
    console.log(`Attempting to read file at: ${filePath}`);
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
        // Check if merged file exists; if not, run Python merge script
        if (!fs.existsSync(filePath)) {
          console.log('Merged file not found, running Python merge script...');
          try {
            await execPromise(`python3 /app/merge_script.py`);
            console.log('Python merge script executed successfully');
          } catch (error) {
            throw new Error(`Failed to generate merged file: ${error.message}`);
          }
        }
        break;
    }

    // Read Excel file
    console.log(`Attempting to read file at: ${filePath}`);
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