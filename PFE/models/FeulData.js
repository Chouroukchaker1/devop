const mongoose = require('mongoose');

const fuelDataSchema = new mongoose.Schema({
  dateOfFlight: { type: String, required: true, alias: 'Date of Flight' },
  timeOfDeparture: { type: String, required: true, alias: 'Time of Departure' },
  flightNumber: { type: String, required: true, alias: 'Flight Number' },
  departureAirport: { type: String, required: true, alias: 'Departure Airport' },
  arrivalAirport: { type: String, required: true, alias: 'Arrival Airport' },
  taxiFuel: { type: Number, default: 0, alias: 'Taxi Fuel' },
  tripFuel: { type: Number, default: 0, alias: 'Trip Fuel' },
  contingencyFuel: { type: Number, default: 0, alias: 'Contingency Fuel' },
  blockFuel: { type: Number, default: 0, alias: 'Block Fuel' },
  finalReserve: { type: Number, default: 0, alias: 'Final Reserve' },
  additionalFuel: { type: Number, default: 0, alias: 'Additional Fuel (tonnes)' },
  fuelForOtherSafetyRules: { type: Number, default: 0, alias: 'Fuel for other safety rules (tonnes)' },
  discretionaryFuel: { type: Number, default: 0, alias: 'Discretionary Fuel' },
  extraFuel: { type: Number, default: 0, alias: 'Extra Fuel' },
  reason: { type: String, default: '', alias: 'Reason' },
  economicTankeringCategory: { type: String, default: '', alias: 'Economic tankering category in the flight plan' },
  alternateFuel: { type: Number, default: 0, alias: 'Alternate Fuel' },
  alternateArrivalAirport: { type: String, default: '', alias: 'Alternate Arrival Airport' },
  fob: { type: Number, default: 0, alias: 'FOB' },
  blockOn: { type: Number, default: 0, alias: 'Block On' },
  blockOff: { type: Number, default: 0, alias: 'Block Off' },
  upliftVolume: { type: Number, default: 0, alias: 'Uplift Volume' },
  upliftDensity: { type: Number, default: 0, alias: 'Uplift Density' },
  pilotId: { type: String, default: '', alias: 'Pilot ID' },
  transferred: { type: Boolean, default: false }
}, {
  timestamps: true, // ➕ auto ajoute createdAt et updatedAt
  toJSON: { virtuals: true, aliases: true },
  toObject: { virtuals: true, aliases: true }
});

// Met à jour updatedAt manuellement si nécessaire
fuelDataSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

fuelDataSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

module.exports = mongoose.model('FuelData', fuelDataSchema);
