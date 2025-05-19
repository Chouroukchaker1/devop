// routes/powerbiRoutes.js
const express = require('express');
const router = express.Router();
const FuelModel = require('../models/FeulData'); // Ton modèle MongoDB

// Route pour Power BI
router.get('/fueldata', async (req, res) => {
  try {
    const data = await FuelModel.find({}, { _id: 0, __v: 0 }); // Sans ID mongo
    res.json(data); // Power BI attend un tableau pur
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
