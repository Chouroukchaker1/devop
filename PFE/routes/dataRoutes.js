const express = require('express');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { parse } = require('json2csv');
const DataScheduler = require('../routes/schedulerRoutes');
const router = express.Router();

// Chemins des fichiers
const FUEL_DATA_PATH = 'C:/Users/lenovo/Desktop/PFE/datax/data/all_fuel_data.xlsx';
const MERGED_DATA_PATH = 'C:/Users/lenovo/Desktop/PFE/output/merged_data.xlsx/';
const FLIGHT_DATA_PATH = 'C:/Users/lenovo/Desktop/PFE/sample_data/dataRaportProcessed.xlsx';

// Helper pour lire les fichiers Excel
const readExcelFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error('File not found');
  }
  const workbook = xlsx.readFile(filePath);
  return xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
};

// Route pour obtenir les données au format JSON
router.get('/json/:dataType', (req, res) => {
  try {
    let filePath;
    switch(req.params.dataType) {
      case 'fuel':
        filePath = FUEL_DATA_PATH;
        break;
      case 'flight':
        filePath = FLIGHT_DATA_PATH;
        break;
      case 'merged':
        filePath = MERGED_DATA_PATH;
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    const data = readExcelFile(filePath);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route pour télécharger en Excel
router.get('/excel/:dataType', (req, res) => {
  try {
    let filePath, fileName;
    switch(req.params.dataType) {
      case 'fuel':
        filePath = FUEL_DATA_PATH;
        fileName = 'fuel_data.xlsx';
        break;
      case 'flight':
        filePath = FLIGHT_DATA_PATH;
        fileName = 'flight_data.xlsx';
        break;
      case 'merged':
        filePath = MERGED_DATA_PATH;
        fileName = 'merged_data.xlsx';
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.download(filePath, fileName);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route pour télécharger en CSV
router.get('/csv/:dataType', (req, res) => {
  try {
    let filePath, fileName;
    switch(req.params.dataType) {
      case 'fuel':
        filePath = FUEL_DATA_PATH;
        fileName = 'fuel_data.csv';
        break;
      case 'flight':
        filePath = FLIGHT_DATA_PATH;
        fileName = 'flight_data.csv';
        break;
      case 'merged':
        filePath = MERGED_DATA_PATH;
        fileName = 'merged_data.csv';
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    const data = readExcelFile(filePath);
    const csv = parse(data);
    
    res.header('Content-Type', 'text/csv');
    res.attachment(fileName);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Route pour télécharger en XML
router.get('/xml/:dataType', (req, res) => {
  try {
    let filePath, fileName;
    switch(req.params.dataType) {
      case 'fuel':
        filePath = FUEL_DATA_PATH;
        fileName = 'fuel_data.xml';
        break;
      case 'flight':
        filePath = FLIGHT_DATA_PATH;
        fileName = 'flight_data.xml';
        break;
      case 'merged':
        filePath = MERGED_DATA_PATH;
        fileName = 'merged_data.xml';
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    const data = readExcelFile(filePath);
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
    
    data.forEach(item => {
      xml += '  <record>\n';
      for (const [key, value] of Object.entries(item)) {
        xml += `    <${key}>${value}</${key}>\n`;
      }
      xml += '  </record>\n';
    });
    
    xml += '</data>';
    
    res.header('Content-Type', 'application/xml');
    res.attachment(fileName);
    res.send(xml);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
router.get('/new-records/:type', async (req, res) => {
  const { type } = req.params;
  if (!['fuel', 'flight', 'merged'].includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid data type' });
  }

  try {
    const result = await scheduler.getNewRecords(type);
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(500).json({ success: false, message: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;