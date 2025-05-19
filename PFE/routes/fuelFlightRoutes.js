const express = require("express");
const router = express.Router();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");
const FuelData = require('../models/FeulData');
// Chemin vers le fichier Excel généré
const EXCEL_OUTPUT_PATH = path.join(__dirname, "../extracted_fuel_data.xlsx");

// Route pour exécuter l'extraction
router.post("/run-extraction", (req, res) => {
  const pythonCommand = process.platform === "win32" ? "py" : "python3";
  const scriptPath = path.join(__dirname, "../extraction.py");
  
  exec(`${pythonCommand} "${scriptPath}"`, (error, stdout, stderr) => {
    if (error || stderr) {
      console.error("Extraction error:", error || stderr);
      return res.status(500).json({
        success: false,
        error: error?.message || stderr,
        details: "Failed to execute extraction script"
      });
    }
    
    // Vérifier que le fichier Excel a bien été créé
    if (!fs.existsSync(EXCEL_OUTPUT_PATH)) {
      return res.status(500).json({
        success: false,
        error: "Output Excel file not found",
        details: "The extraction script ran but did not produce the expected output file"
      });
    }
    
    res.json({
      success: true,
      output: stdout,
      filePath: EXCEL_OUTPUT_PATH
    });
  });
});

// Route pour télécharger les données extraites
router.get("/download/extracted-fuel-data", (req, res) => {
  if (!fs.existsSync(EXCEL_OUTPUT_PATH)) {
    return res.status(404).json({
      success: false,
      message: "File not found. Please run extraction first."
    });
  }
  
  try {
    // Lire le fichier Excel
    const workbook = XLSX.readFile(EXCEL_OUTPUT_PATH);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // Convertir en buffer pour le téléchargement
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'buffer'
    });
    
    // Configurer les headers de la réponse
    res.setHeader('Content-Disposition', 'attachment; filename=extracted_fuel_data.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    
    // Envoyer le fichier
    res.send(excelBuffer);
  } catch (err) {
    console.error("Error processing Excel file:", err);
    res.status(500).json({
      success: false,
      error: err.message,
      details: "Error processing the Excel file"
    });
  }
});

// Route pour télécharger le fichier all_fuel_data.xlsx
router.get('/download/all_fuel_data', (req, res) => {
  const filePath = 'C:/Users/lenovo/Desktop/PFE/datax/data/all_fuel_data.xlsx';
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'all_fuel_data.xlsx', (err) => {
      if (err) {
        console.error("❌ Erreur lors du téléchargement :", err.message);
        res.status(500).json({ success: false, message: "Erreur lors du téléchargement du fichier." });
      }
    });
  } else {
    console.error("❌ Le fichier n'existe pas à cet emplacement.");
    res.status(404).json({ success: false, message: "Le fichier n'a pas été trouvé." });
  }
});

// Route pour télécharger le fichier merged_data.xlsx
router.get('/download/merged-data', (req, res) => {
  const filePath = 'C:/Users/lenovo/Desktop/PFE/merged_data.xlsx'; // Corrigé le nom du fichier
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'merged_data.xlsx', (err) => {
      if (err) {
        console.error("❌ Erreur lors du téléchargement :", err.message);
        res.status(500).json({ success: false, message: "Erreur lors du téléchargement du fichier." });
      }
    });
  } else {
    console.error("❌ Le fichier n'existe pas à cet emplacement:", filePath);
    res.status(404).json({ success: false, message: "Le fichier n'a pas été trouvé." });
  }
});

// Route pour télécharger le fichier dataRaportProcessed.xlsx
router.get('/download/data-rapport-processed', (req, res) => {
  const filePath = 'C:/Users/lenovo/Desktop/PFE/sample_data/dataRaportProcessed.xlsx';
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'dataRaportProcessed.xlsx', (err) => {
      if (err) {
        console.error("❌ Erreur lors du téléchargement :", err.message);
        res.status(500).json({ success: false, message: "Erreur lors du téléchargement du fichier." });
      }
    });
  } else {
    console.error("❌ Le fichier n'existe pas à cet emplacement.");
    res.status(404).json({ success: false, message: "Le fichier n'a pas été trouvé." });
  }
});
// Ajout d’un test pour mise à jour
router.post('/update-fuel/:flightNumber', async (req, res) => {
  try {
    const updated = await FuelData.findOneAndUpdate(
      { flightNumber: req.params.flightNumber },
      { $set: { tripFuel: Math.floor(Math.random() * 1000) + 100 } },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;