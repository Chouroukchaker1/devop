const mongoose = require('mongoose');
const FuelData = require('../models/FuelData');
const FuelDataSchema = new mongoose.Schema({
  flightNumber: { type: String, required: true, trim: true },
  dateOfFlight: { type: Date, required: true },
  timeOfDeparture: { type: String, required: true, trim: true },
  departureAirport: { type: String, required: true, trim: true },
  arrivalAirport: { type: String, required: true, trim: true },
  taxiFuel: { type: Number, required: true },
  tripFuel: { type: Number, required: true },
  contingencyFuel: { type: Number, required: true },
  extraFuel: { type: Number, required: true },
  blockFuel: { type: Number, required: true },
  upliftVolume: { type: Number, required: true },
  upliftDensity: { type: Number, required: true },
  blockOn: { type: String, required: true, trim: true },
  blockOff: { type: String, required: true, trim: true },
  piloteId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

const FlightDataSchema = new mongoose.Schema({
  dateOfOperationUTC: { type: Date, required: true },
  acRegistration: { type: String, required: true },
  flightID: { type: String, required: true, unique: true },
  icaoCallSign: { type: String, required: true },
  acType: { type: String, required: true },
  company: { type: String, required: true },
  flightType: { type: String, required: true },
  departingAirportICAOCode: { type: String, required: true },
  departureTimeUTC: { type: String, required: true },
  destinationAirportICAOCode: { type: String, required: true },
  arrivalTimeUTC: { type: String, required: true }
}, { timestamps: true });

// Vérification si le modèle a déjà été défini
const FuelData = mongoose.models.FuelData || mongoose.model('FuelData', FuelDataSchema);
const FlightData = mongoose.models.FlightData || mongoose.model('FlightData', FlightDataSchema);

module.exports = { FuelData, FlightData };
