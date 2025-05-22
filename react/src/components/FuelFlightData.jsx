import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FuelFlightData.css'; // Fichier CSS pour le style

const FuelFlightData = () => {
  const [data, setData] = useState([]); // État pour stocker les données fusionnées
  const [loading, setLoading] = useState(true); // État pour gérer le chargement
  const [error, setError] = useState(null); // État pour gérer les erreurs

  // Fonction pour récupérer les données depuis l'API
  const fetchData = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/fuel-flight-data');
      setData(response.data.datafuel_flight); // Mettre à jour l'état avec les données fusionnées
      setLoading(false); // Désactiver le chargement
    } catch (err) {
      console.error('Erreur lors de la récupération des données :', err);
      setError('Erreur lors de la récupération des données. Veuillez réessayer.'); // Afficher un message d'erreur
      setLoading(false); // Désactiver le chargement
    }
  };

  // Utiliser useEffect pour appeler fetchData au montage du composant
  useEffect(() => {
    fetchData();
  }, []);

  // Afficher un message de chargement
  if (loading) {
    return <div>Chargement en cours...</div>;
  }

  // Afficher un message d'erreur
  if (error) {
    return <div>{error}</div>;
  }

  // Afficher les données dans un tableau
  return (
    <div className="fuel-flight-container">
      <h1>Données Fusionnées FuelData et FlightData</h1>
      <table className="fuel-flight-table">
        <thead>
          <tr>
            <th>Flight ID</th>
            <th>Date</th>
            <th>Heure de Départ</th>
            <th>Aéroport de Départ</th>
            <th>Aéroport d'Arrivée</th>
            <th>Immatriculation</th>
            <th>Type d'Avion</th>
            <th>Compagnie</th>
            <th>Type de Vol</th>
            <th>Block On</th>
            <th>Block Off</th>
            <th>Taxi Fuel</th>
            <th>Trip Fuel</th>
            <th>Contingency Fuel</th>
            <th>Extra Fuel</th>
            <th>Block Fuel</th>
            <th>Uplift Volume</th>
            <th>Uplift Density</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.flightID}</td>
              <td>{new Date(item.dateOfOperationUTC).toLocaleDateString()}</td>
              <td>{item.timeOfDeparture}</td>
              <td>{item.departureAirport}</td>
              <td>{item.arrivalAirport}</td>
              <td>{item.acRegistration}</td>
              <td>{item.acType}</td>
              <td>{item.company}</td>
              <td>{item.flightType}</td>
              <td>{item.blockOn}</td>
              <td>{item.blockOff}</td>
              <td>{item.taxiFuel}</td>
              <td>{item.tripFuel}</td>
              <td>{item.contingencyFuel}</td>
              <td>{item.extraFuel}</td>
              <td>{item.blockFuel}</td>
              <td>{item.upliftVolume}</td>
              <td>{item.upliftDensity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FuelFlightData;