const FuelData = require('../models/FeulData');
const { validationResult } = require('express-validator');

// Create a new fuel data entry
exports.createFuelData = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const fuelData = new FuelData({
      dateOfFlight: req.body.dateOfFlight,
      timeOfDeparture: req.body.timeOfDeparture,
      flightNumber: req.body.flightNumber,
      departureAirport: req.body.departureAirport,
      arrivalAirport: req.body.arrivalAirport,
      taxiFuel: req.body.taxiFuel || 0,
      tripFuel: req.body.tripFuel || 0,
      contingencyFuel: req.body.contingencyFuel || 0,
      blockFuel: req.body.blockFuel || 0,
      finalReserve: req.body.finalReserve || 0,
      additionalFuel: req.body.additionalFuel || 0,
      fuelForOtherSafetyRules: req.body.fuelForOtherSafetyRules || 0,
      discretionaryFuel: req.body.discretionaryFuel || 0,
      extraFuel: req.body.extraFuel || 0,
      reason: req.body.reason || '',
      economicTankeringCategory: req.body.economicTankeringCategory || '',
      alternateFuel: req.body.alternateFuel || 0,
      alternateArrivalAirport: req.body.alternateArrivalAirport || '',
      fob: req.body.fob || 0,
      blockOn: req.body.blockOn || 0,
      blockOff: req.body.blockOff || 0,
      upliftVolume: req.body.upliftVolume || 0,
      upliftDensity: req.body.upliftDensity || 0,
      pilotId: req.body.pilotId || ''
    });

    await fuelData.save();

    res.status(201).json({
      success: true,
      message: 'Fuel data saved successfully',
      data: fuelData
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error saving fuel data', error: error.message });
  }
};

// Get all fuel data
exports.getAllFuelData = async (req, res) => {
  try {
    const fuelData = await FuelData.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, count: fuelData.length, data: fuelData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving fuel data', error: error.message });
  }
};

// Get a specific fuel data entry
exports.getFuelData = async (req, res) => {
  try {
    const fuelData = await FuelData.findById(req.params.id).lean();
    if (!fuelData) {
      return res.status(404).json({ success: false, message: 'Fuel data not found' });
    }
    res.json({ success: true, data: fuelData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving fuel data', error: error.message });
  }
};

// Update a fuel data entry
exports.updateFuelData = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  try {
    const fuelData = await FuelData.findByIdAndUpdate(
      req.params.id,
      {
        dateOfFlight: req.body.dateOfFlight,
        timeOfDeparture: req.body.timeOfDeparture,
        flightNumber: req.body.flightNumber,
        departureAirport: req.body.departureAirport,
        arrivalAirport: req.body.arrivalAirport,
        taxiFuel: req.body.taxiFuel || 0,
        tripFuel: req.body.tripFuel || 0,
        contingencyFuel: req.body.contingencyFuel || 0,
        blockFuel: req.body.blockFuel || 0,
        finalReserve: req.body.finalReserve || 0,
        additionalFuel: req.body.additionalFuel || 0,
        fuelForOtherSafetyRules: req.body.fuelForOtherSafetyRules || 0,
        discretionaryFuel: req.body.discretionaryFuel || 0,
        extraFuel: req.body.extraFuel || 0,
        reason: req.body.reason || '',
        economicTankeringCategory: req.body.economicTankeringCategory || '',
        alternateFuel: req.body.alternateFuel || 0,
        alternateArrivalAirport: req.body.alternateArrivalAirport || '',
        fob: req.body.fob || 0,
        blockOn: req.body.blockOn || 0,
        blockOff: req.body.blockOff || 0,
        upliftVolume: req.body.upliftVolume || 0,
        upliftDensity: req.body.upliftDensity || 0,
        pilotId: req.body.pilotId || ''
      },
      { new: true, runValidators: true }
    ).lean();
    if (!fuelData) {
      return res.status(404).json({ success: false, message: 'Fuel data not found' });
    }
    res.json({ success: true, message: 'Fuel data updated successfully', data: fuelData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating fuel data', error: error.message });
  }
};

// Delete a fuel data entry
exports.deleteFuelData = async (req, res) => {
  try {
    const fuelData = await FuelData.findByIdAndDelete(req.params.id);
    if (!fuelData) {
      return res.status(404).json({ success: false, message: 'Fuel data not found' });
    }
    res.json({ success: true, message: 'Fuel data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error deleting fuel data', error: error.message });
  }
};

// Bulk create fuel data
exports.bulkCreateFuelData = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { fuels } = req.body;

  try {
    const formattedFuels = fuels.map(fuel => ({
      dateOfFlight: fuel.dateOfFlight,
      timeOfDeparture: fuel.timeOfDeparture,
      flightNumber: fuel.flightNumber,
      departureAirport: fuel.departureAirport,
      arrivalAirport: fuel.arrivalAirport,
      taxiFuel: fuel.taxiFuel || 0,
      tripFuel: fuel.tripFuel || 0,
      contingencyFuel: fuel.contingencyFuel || 0,
      blockFuel: fuel.blockFuel || 0,
      finalReserve: fuel.finalReserve || 0,
      additionalFuel: fuel.additionalFuel || 0,
      fuelForOtherSafetyRules: fuel.fuelForOtherSafetyRules || 0,
      discretionaryFuel: fuel.discretionaryFuel || 0,
      extraFuel: fuel.extraFuel || 0,
      reason: fuel.reason || '',
      economicTankeringCategory: fuel.economicTankeringCategory || '',
      alternateFuel: fuel.alternateFuel || 0,
      alternateArrivalAirport: fuel.alternateArrivalAirport || '',
      fob: fuel.fob || 0,
      blockOn: fuel.blockOn || 0,
      blockOff: fuel.blockOff || 0,
      upliftVolume: fuel.upliftVolume || 0,
      upliftDensity: fuel.upliftDensity || 0,
      pilotId: fuel.pilotId || ''
    }));

    const insertedFuelData = await FuelData.insertMany(formattedFuels, { ordered: false });

    res.status(201).json({
      success: true,
      message: 'Bulk fuel data saved successfully',
      count: insertedFuelData.length,
      data: insertedFuelData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error saving bulk fuel data',
      error: error.message
    });
  }
};