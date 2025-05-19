const mongoose = require('mongoose');

const flightDataSchema = new mongoose.Schema({
  dateOfOperationUTC: { type: Date, required: true },
  acRegistration: { type: String, required: true },
  flightID: { type: String, required: true, unique: true },
  icaoCallSign: { type: String, required: true },
  acType: { type: String, required: true },
  company: { type: String, default: '' },
  flightType: { type: String, required: true },
  departingAirportICAOCode: { type: String, required: true },
  departureTimeUTC: { type: String, required: true },
  destinationAirportICAOCode: { type: String, required: true },
  arrivalTimeUTC: { type: String, required: true },
  upliftVolumeLitres: { type: Number, default: null },
  upliftDensity: { type: Number, default: null },
  blockOnTonnes: { type: Number, default: null },
  blockOffTonnes: { type: Number, default: null },
  transferred: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('FlightData', flightDataSchema);