const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

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
router.get('/download/megred-data', (req, res) => {
  const filePath = 'C:/Users/lenovo/Desktop/PFE/megred_data.xlsx'; // Spécifiez le chemin du fichier
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'megred_data.xlsx', (err) => {
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

// Route pour télécharger le fichier dataRaportProcessed.xlsx
router.get('/download/data-rapport-processed', (req, res) => {
  const filePath = 'C:/Users/lenovo/Desktop/PFE/sample_data/dataRaportProcessed.xlsx'; // Spécifiez le chemin du fichier
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

module.exports = router;
