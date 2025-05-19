const FlightData = require('../models/flightDataModel');
const { validationResult } = require('express-validator');
const Notification = require('../models/Notification');

exports.createFlightData = async (req, res) => {
  // Valider les données de la requête
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    // Créer une nouvelle instance de FlightData
    const flightData = new FlightData({
      dateOfOperationUTC: req.body.dateOfOperationUTC,
      acRegistration: req.body.acRegistration,
      flightID: req.body.flightID,
      icaoCallSign: req.body.icaoCallSign,
      acType: req.body.acType,
      company: req.body.company || '',
      flightType: req.body.flightType,
      departingAirportICAOCode: req.body.departingAirportICAOCode,
      departureTimeUTC: req.body.departureTimeUTC,
      destinationAirportICAOCode: req.body.destinationAirportICAOCode,
      arrivalTimeUTC: req.body.arrivalTimeUTC,
      upliftVolumeLitres: req.body.upliftVolumeLitres || null,
      upliftDensity: req.body.upliftDensity || null,
      blockOnTonnes: req.body.blockOnTonnes || null,
      blockOffTonnes: req.body.blockOffTonnes || null,
    });

    // Enregistrer les données de vol
    await flightData.save();

    // Créer une notification
    const notification = new Notification({
      userId: req.user._id,
      message: `Enregistrement de vol ${flightData.flightID} créé avec succès`,
      read: false,
    });
    await notification.save();

    // Répondre avec succès
    res.status(201).json({
      success: true,
      message: 'Données de vol enregistrées avec succès',
      data: flightData,
    });
  } catch (error) {
    // Gérer l'erreur de clé unique (flightID)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `L'ID de vol ${req.body.flightID} existe déjà`,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement des données de vol',
      error: error.message,
    });
  }
};

exports.getAllFlights = async (req, res) => {
  try {
    const flightData = await FlightData.find().sort({ dateOfOperationUTC: -1 });
    res.json({ success: true, count: flightData.length, data: flightData });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving flight data', error: error.message });
  }
};

exports.getFlightById = async (req, res) => {
  try {
    const flightData = await FlightData.findById(req.params.id);
    if (!flightData) {
      return res.status(404).json({ message: 'Flight data not found' });
    }
    res.json({ success: true, data: flightData });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving flight data', error: error.message });
  }
};

exports.updateFlightData = async (req, res) => {
  try {
    const flightData = await FlightData.findByIdAndUpdate(
      req.params.id,
      {
        dateOfOperationUTC: req.body.dateOfOperationUTC,
        acRegistration: req.body.acRegistration,
        flightID: req.body.flightID,
        icaoCallSign: req.body.icaoCallSign,
        acType: req.body.acType,
        company: req.body.company || '',
        flightType: req.body.flightType,
        departingAirportICAOCode: req.body.departingAirportICAOCode,
        departureTimeUTC: req.body.departureTimeUTC,
        destinationAirportICAOCode: req.body.destinationAirportICAOCode,
        arrivalTimeUTC: req.body.arrivalTimeUTC,
        upliftVolumeLitres: req.body.upliftVolumeLitres || null,
        upliftDensity: req.body.upliftDensity || null,
        blockOnTonnes: req.body.blockOnTonnes || null,
        blockOffTonnes: req.body.blockOffTonnes || null
      },
      { new: true, runValidators: true }
    );
    if (!flightData) {
      return res.status(404).json({ message: 'Flight data not found' });
    }
    res.json({ success: true, message: 'Flight data updated successfully', data: flightData });
  } catch (error) {
    res.status(500).json({ message: 'Error updating flight data', error: error.message });
  }
};

exports.deleteFlightData = async (req, res) => {
  try {
    const flightData = await FlightData.findByIdAndDelete(req.params.id);
    if (!flightData) {
      return res.status(404).json({ message: 'Flight data not found' });
    }
    res.json({ success: true, message: 'Flight data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting flight data', error: error.message });
  }
};