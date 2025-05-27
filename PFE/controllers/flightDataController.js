const FlightData = require('../models/flightDataModel');
const Notification = require('../models/Notification');

exports.createFlightData = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'Utilisateur non authentifié' });
    }

    // Handle both single object and array of flight data
    const inputData = Array.isArray(req.body) ? req.body : [req.body];

    const createdFlights = [];
    const notifications = [];

    // Process each flight data entry
    for (const data of inputData) {
      const flightData = new FlightData({
        dateOfOperationUTC: data.dateOfOperationUTC,
        acRegistration: data.acRegistration,
        flightID: data.flightID,
        icaoCallSign: data.icaoCallSign,
        acType: data.acType,
        company: data.company || '',
        flightType: data.flightType,
        departingAirportICAOCode: data.departingAirportICAOCode,
        departureTimeUTC: data.departureTimeUTC,
        destinationAirportICAOCode: data.destinationAirportICAOCode,
        arrivalTimeUTC: data.arrivalTimeUTC,
        upliftVolumeLitres: data.upliftVolumeLitres ?? null,
        upliftDensity: data.upliftDensity ?? null,
        blockOnTonnes: data.blockOnTonnes ?? null,
        blockOffTonnes: data.blockOffTonnes ?? null,
      });

      // Enregistrer les données de vol
      const savedFlight = await flightData.save();

      // Créer une notification
      const notification = new Notification({
        userId: req.user._id,
        message: `Enregistrement de vol ${savedFlight.flightID} créé avec succès`,
        read: false,
      });
      await notification.save();

      createdFlights.push(savedFlight);
      notifications.push(notification);
    }

    // Répondre avec succès
    res.status(201).json({
      success: true,
      message: `Données de vol enregistrées avec succès (${createdFlights.length} vol(s))`,
      data: createdFlights.length === 1 ? createdFlights[0] : createdFlights,
    });
  } catch (error) {
    // Gérer l'erreur de clé unique (flightID)
    if (error.code === 11000) {
      const duplicateFlightID = req.body.flightID || (Array.isArray(req.body) ? req.body.find(item => item.flightID)?.flightID : 'inconnu');
      return res.status(400).json({
        success: false,
        message: `L'ID de vol ${duplicateFlightID} existe déjà`,
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