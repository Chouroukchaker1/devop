const express = require('express');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Chemins des fichiers
const FLIGHT_DATA_PATH = 'C:/Users/lenovo/Desktop/PFE/sample_data/dataRaportProcessed.xlsx';
const FUEL_DATA_PATH = 'C:/Users/lenovo/Desktop/PFE/datax/data/all_fuel_data.xlsx';

// Fonction pour lire un fichier Excel
const readExcelFile = (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier non trouvé : ${filePath}`);
  }
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return { workbook, sheet, sheetName };
};

// Fonction pour écrire dans un fichier Excel
const writeExcelFile = (filePath, workbook) => {
  try {
    xlsx.writeFile(workbook, filePath);
  } catch (error) {
    throw new Error(`Erreur lors de l'écriture du fichier Excel : ${error.message}`);
  }
};

// Route pour obtenir les données manquantes
router.get('/', async (req, res) => {
  try {
    // Colonnes attendues pour chaque fichier
    const expectedFlightColumns = [
      'Flight ID',
      'Date of operation (UTC)',
      'Departure Time/ Block-off time (UTC)',
      'AC registration',
    ];

    const expectedFuelColumns = [
      'Date of Flight',
      'Time of Departure',
      'Flight Number',
      'DepartureAirport',
      'ArrivalAirport',
      'TaxiFuel',
      'TripFuel',
      'ContingencyFuel',
      'BlockFuel',
      'FinalReserve',
      'Additional Fuel (tonnes)',
      'Fuel for other safety rules (tonnes)',
      'Discretionary Fuel',
      'Extra Fuel',
      'Reason',
      'Economic tankering category in the flight plan',
      'AlternateFuel',
      'Alternate Arrival Airport',
      'FOB',
    ];

    // Fonction pour analyser les données manquantes
    const analyzeMissingData = (data, expectedColumns, fileName) => {
      const missingDataReport = {
        file: fileName,
        totalRows: data.length,
        missingByColumn: {},
        missingRows: [],
      };

      // Initialiser le rapport pour chaque colonne
      expectedColumns.forEach((col) => {
        missingDataReport.missingByColumn[col] = {
          missingCount: 0,
          missingRowIndices: [],
        };
      });

      // Analyser chaque ligne
      data.forEach((row, index) => {
        let hasMissing = false;
        const missingColumns = [];

        expectedColumns.forEach((col) => {
          const value = row[col];
          // Considérer comme manquant si null, undefined, ou chaîne vide
          if (value === null || value === undefined || value === '') {
            missingDataReport.missingByColumn[col].missingCount += 1;
            missingDataReport.missingByColumn[col].missingRowIndices.push(index);
            missingColumns.push(col);
            hasMissing = true;
          }
        });

        // Ajouter la ligne au rapport si elle contient des données manquantes
        if (hasMissing) {
          const flightId = fileName === 'dataRaportProcessed.xlsx' ? row['Flight ID'] : row['Flight Number'];
          const date = fileName === 'dataRaportProcessed.xlsx' ? row['Date of operation (UTC)'] : row['Date of Flight'];
          
          missingDataReport.missingRows.push({
            rowIndex: index,
            flightId: flightId || 'N/A', // Valeur par défaut si manquant
            date: date || 'N/A', // Valeur par défaut si manquant
            missingColumns,
          });
        }
      });

      return missingDataReport;
    };

    // Lire les fichiers
    const flightData = readExcelFile(FLIGHT_DATA_PATH);
    const fuelData = readExcelFile(FUEL_DATA_PATH);

    // Convertir les feuilles en JSON pour l'analyse
    const flightJson = xlsx.utils.sheet_to_json(flightData.sheet, { defval: null });
    const fuelJson = xlsx.utils.sheet_to_json(fuelData.sheet, { defval: null });

    // Analyser les données manquantes
    const flightMissingReport = analyzeMissingData(flightJson, expectedFlightColumns, 'dataRaportProcessed.xlsx');
    const fuelMissingReport = analyzeMissingData(fuelJson, expectedFuelColumns, 'all_fuel_data.xlsx');

    // Construire la réponse
    const response = {
      success: true,
      reports: [
        flightMissingReport,
        fuelMissingReport,
      ],
    };

    // Vérifier si des données manquantes ont été trouvées
    const hasMissingData = response.reports.some(
      (report) => Object.values(report.missingByColumn).some((col) => col.missingCount > 0)
    );

    if (!hasMissingData) {
      response.message = 'Aucune donnée manquante trouvée dans les fichiers.';
    } else {
      response.message = 'Données manquantes détectées. Consultez les rapports pour plus de détails, incluant Flight ID et Date.';
    }

    res.json(response);
  } catch (error) {
    console.error('Erreur lors de l’analyse des données manquantes :', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l’analyse des données manquantes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});

// Route pour compléter une donnée manquante
router.post('/complete', async (req, res) => {
  try {
    const { file, rowIndex, column, value } = req.body;

    // Validation des entrées
    if (!file || rowIndex === undefined || !column || value === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Fichier, ligne, colonne et valeur sont requis.',
      });
    }

    // Déterminer le chemin du fichier
    let filePath;
    if (file === 'dataRaportProcessed.xlsx') {
      filePath = FLIGHT_DATA_PATH;
    } else if (file === 'all_fuel_data.xlsx') {
      filePath = FUEL_DATA_PATH;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Fichier invalide. Utilisez "dataRaportProcessed.xlsx" ou "all_fuel_data.xlsx".',
      });
    }

    // Lire le fichier Excel
    const { workbook, sheet } = readExcelFile(filePath);

    // Convertir les données en JSON pour vérifier les colonnes
    const jsonData = xlsx.utils.sheet_to_json(sheet, { defval: null });

    // Vérifier si la ligne existe
    if (rowIndex < 0 || rowIndex >= jsonData.length) {
      return res.status(400).json({
        success: false,
        message: `Ligne ${rowIndex + 1} invalide pour le fichier ${file}.`,
      });
    }

    // Vérifier si la colonne existe
    const headers = Object.keys(jsonData[0]);
    if (!headers.includes(column)) {
      return res.status(400).json({
        success: false,
        message: `Colonne "${column}" introuvable dans le fichier ${file}.`,
      });
    }

    // Convertir rowIndex (base 0) en adresse de cellule (base 1, en tenant compte de l'en-tête)
    const cellAddress = xlsx.utils.encode_cell({ r: rowIndex + 1, c: headers.indexOf(column) });

    // Mettre à jour la cellule
    sheet[cellAddress] = { v: value, t: typeof value === 'number' ? 'n' : 's' };

    // Écrire les modifications dans le fichier
    writeExcelFile(filePath, workbook);

    res.json({
      success: true,
      message: `Donnée complétée avec succès dans ${file} à la ligne ${rowIndex + 1}, colonne ${column}.`,
    });
  } catch (error) {
    console.error('Erreur lors de la complétion des données :', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la complétion des données',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});
// Route pour récupérer les lignes avec des données manquantes dans les colonnes carburant importantes
router.get('/missing-fuel', async (req, res) => {
  try {
    const importantFuelColumns = [
      'TaxiFuel',
      'TripFuel',
      'ContingencyFuel',
      'BlockFuel',
      'FinalReserve',
      'Additional Fuel (tonnes)',
      'Fuel for other safety rules (tonnes)',
      'Discretionary Fuel',
      'Extra Fuel',
    ];

    const fuelData = readExcelFile(FUEL_DATA_PATH);
    const fuelJson = xlsx.utils.sheet_to_json(fuelData.sheet, { defval: null });

    const missingRows = [];

    fuelJson.forEach((row, index) => {
      const missingColumns = [];

      importantFuelColumns.forEach((col) => {
        const value = row[col];
        if (
          value === null ||
          value === undefined ||
          value === '' ||
          (typeof value === 'string' && value.trim().toUpperCase() === 'N/A')
        ) {
          missingColumns.push(col);
        }
      });

      if (missingColumns.length > 0) {
        missingRows.push({
          rowIndex: index,
          flightId:
            row['Flight Number'] && row['Flight Number'].toString().trim().toUpperCase() !== 'N/A'
              ? row['Flight Number']
              : 'N/A',
          date:
            row['Date of Flight'] && row['Date of Flight'].toString().trim().toUpperCase() !== 'N/A'
              ? row['Date of Flight']
              : 'N/A',
          missingColumns,
        });
      }
    });

    res.json({
      success: true,
      totalMissing: missingRows.length,
      rows: missingRows,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des données de carburant manquantes :', error.message);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données de carburant manquantes',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
});


module.exports = router;