import React, { useState, useContext } from 'react';
import { Container, Button, Card, Table, Alert, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { ThemeContext } from '../App';
import 'bootstrap/dist/css/bootstrap.min.css';

const FlightOptimization = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [optimizationData, setOptimizationData] = useState(null);
  const [totalFuelSavings, setTotalFuelSavings] = useState(null);
  const [totalCO2Savings, setTotalCO2Savings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    setOptimizationData(null);
    setTotalFuelSavings(null);
    setTotalCO2Savings(null);

    try {
      const response = await axios.post('http://localhost:8080/api/optimize-flight');
      if (response.data.success) {
        setOptimizationData(response.data.data.optimization_suggestions);
        setTotalFuelSavings(response.data.data.total_fuel_savings_potential_tonnes);
        setTotalCO2Savings(response.data.data.total_co2_savings_potential_kg);
      } else {
        setError(response.data.message || 'Failed to fetch optimization results.');
      }
    } catch (err) {
      setError('Error connecting to the server. Please try again later.');
      console.error('Flight Optimization error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <h1 className="text-center mb-4">Flight Optimization Assistant</h1>
      <p className="text-center mb-4">
        Optimize your flight plans to reduce fuel consumption and CO2 emissions. Click below to get AI-driven recommendations for fuel uplift and operational adjustments.
      </p>

      <div className="text-center mb-4">
        <Button
          variant="primary"
          size="lg"
          onClick={handleOptimize}
          disabled={loading}
          className={isDarkMode ? 'btn-dark' : ''}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Optimizing...
            </>
          ) : (
            'Run Flight Optimization'
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mt-4">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {(totalFuelSavings || totalCO2Savings) && (
        <Card className={`mt-4 ${isDarkMode ? 'bg-dark text-light' : ''}`}>
          <Card.Body>
            <Card.Title>Optimization Summary</Card.Title>
            <Card.Text>
              <ul>
                {totalFuelSavings && (
                  <li><strong>Total Fuel Savings Potential:</strong> {totalFuelSavings.toFixed(2)} tonnes</li>
                )}
                {totalCO2Savings && (
                  <li><strong>Total CO2 Savings Potential:</strong> {totalCO2Savings.toFixed(2)} kg</li>
                )}
              </ul>
            </Card.Text>
          </Card.Body>
        </Card>
      )}

      {optimizationData && (
        <Card className={`mt-4 ${isDarkMode ? 'bg-dark text-light' : ''}`}>
          <Card.Body>
            <Card.Title>Flight Optimization Recommendations</Card.Title>
            <Card.Text>
              The table below provides recommendations for optimizing fuel uplift for each flight, including potential fuel and CO2 savings.
            </Card.Text>
            <Table striped bordered hover responsive variant={isDarkMode ? 'dark' : 'light'}>
              <thead>
                <tr>
                  <th>Flight Number</th>
                  <th>Date</th>
                  <th>Route</th>
                  <th>Actual Fuel Uplift (tonnes)</th>
                  <th>Optimal Fuel Uplift (tonnes)</th>
                  <th>Fuel Savings (tonnes)</th>
                  <th>CO2 Savings (kg)</th>
                  <th>Recommendation</th>
                </tr>
              </thead>
              <tbody>
                {optimizationData.map((row, index) => (
                  <tr key={index}>
                    <td>{row['Flight Number']}</td>
                    <td>{row['Date of Flight']}</td>
                    <td>{row['Route']}</td>
                    <td>{row['Actual Fuel Uplift (tonnes)'].toFixed(2)}</td>
                    <td>{row['Predicted Optimal Fuel Uplift (tonnes)'].toFixed(2)}</td>
                    <td>{row['Fuel Savings Potential (tonnes)'].toFixed(2)}</td>
                    <td>{row['CO2 Savings Potential (kg)'].toFixed(2)}</td>
                    <td>{row['Recommendation']}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default FlightOptimization;