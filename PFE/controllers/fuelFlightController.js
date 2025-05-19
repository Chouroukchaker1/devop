const { FuelData, FlightData } = require('../models/fuelFlightModel');

const getFuelFlightData = async (req, res) => {
  try {
    // Récupérer toutes les données FuelData et FlightData
    const fuelDataList = await FuelData.find();
    const flightDataList = await FlightData.find();

    // Fusionner les données lorsque les critères sont identiques
    const datafuel_flight = fuelDataList.map(fuelData => {
      const matchingFlight = flightDataList.find(flight => 
        flight.flightID === fuelData.flightNumber &&
        flight.dateOfOperationUTC.toISOString().split('T')[0] === fuelData.dateOfFlight.toISOString().split('T')[0] &&
        flight.departureTimeUTC === fuelData.timeOfDeparture &&
        flight.destinationAirportICAOCode === fuelData.arrivalAirport
      );

      if (matchingFlight) {
        return {
          flightID: matchingFlight.flightID,
          dateOfOperationUTC: matchingFlight.dateOfOperationUTC,
          timeOfDeparture: matchingFlight.departureTimeUTC,
          departureAirport: fuelData.departureAirport,
          arrivalAirport: fuelData.arrivalAirport,
          acRegistration: matchingFlight.acRegistration,
          icaoCallSign: matchingFlight.icaoCallSign,
          acType: matchingFlight.acType,
          company: matchingFlight.company,
          flightType: matchingFlight.flightType,
          blockOn: fuelData.blockOn,
          blockOff: fuelData.blockOff,
          taxiFuel: fuelData.taxiFuel,
          tripFuel: fuelData.tripFuel,
          contingencyFuel: fuelData.contingencyFuel,
          extraFuel: fuelData.extraFuel,
          blockFuel: fuelData.blockFuel,
          upliftVolume: fuelData.upliftVolume,
          upliftDensity: fuelData.upliftDensity,
          piloteId: fuelData.piloteId
        };
      }
    }).filter(entry => entry !== undefined);

    res.status(200).json({ datafuel_flight });
  } catch (error) {
    console.error("Erreur de la récupération   des données :", error);
    res.status(500).json({ message: "Erreur ", error });
  }
};

module.exports = { getFuelFlightData };
