import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, BarChart, Bar, ResponsiveContainer } from 'recharts';

const FuelDataComponent = ({ flightData = [] }) => {
  const [chartType, setChartType] = useState('line');

  // Vérifier si flightData existe et est un tableau avant de le mapper
  const chartData = Array.isArray(flightData) ? flightData.map(flight => ({
    name: `Vol ${flight["Flight Number"]}`,
    TaxiFuel: flight.TaxiFuel,
    TripFuel: flight.TripFuel,
    ContingencyFuel: flight.ContingencyFuel,
    BlockFuel: flight.BlockFuel,
    LandingFuel: flight.LandingFuel
  })) : [];

  return (
    <div className="container mx-auto p-4">
      {/* Sélecteur de type de graphique */}
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2">Type de Graphique:</h3>
        <div className="flex space-x-4">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 rounded ${chartType === 'line' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Ligne
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 rounded ${chartType === 'bar' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Barre
          </button>
        </div>
      </div>

      {/* Message si aucune donnée */}
      {(!Array.isArray(flightData) || flightData.length === 0) && (
        <div className="text-center p-4 bg-yellow-100 rounded">
          Aucune donnée de vol disponible. Veuillez vérifier que les données sont correctement chargées.
        </div>
      )}

      {/* Graphiques Recharts */}
      {Array.isArray(flightData) && flightData.length > 0 && (
        <div className="w-full overflow-x-auto mb-6">
          <ResponsiveContainer width="100%" height={400}>
            {chartType === 'line' ? (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="TaxiFuel" stroke="#8884d8" name="Carburant de Taxi" />
                <Line type="monotone" dataKey="TripFuel" stroke="#82ca9d" name="Carburant de Voyage" />
                <Line type="monotone" dataKey="ContingencyFuel" stroke="#ff7300" name="Carburant de Contingence" />
                <Line type="monotone" dataKey="BlockFuel" stroke="#0088aa" name="Carburant de Bloc" />
                <Line type="monotone" dataKey="LandingFuel" stroke="#e60049" name="Carburant d'Atterrissage" />
              </LineChart>
            ) : (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="TaxiFuel" fill="#8884d8" name="Carburant de Taxi" />
                <Bar dataKey="TripFuel" fill="#82ca9d" name="Carburant de Voyage" />
                <Bar dataKey="ContingencyFuel" fill="#ff7300" name="Carburant de Contingence" />
                <Bar dataKey="BlockFuel" fill="#0088aa" name="Carburant de Bloc" />
                <Bar dataKey="LandingFuel" fill="#e60049" name="Carburant d'Atterrissage" />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default FuelDataComponent;