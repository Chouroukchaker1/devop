const express = require("express");
 
const router = express.Router();
const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

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

module.exports = router;