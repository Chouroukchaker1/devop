import React, { useEffect, useState } from 'react';
import { Container, Table, Alert, Spinner, Button } from 'react-bootstrap';
import axios from 'axios';

const FuelPrediction = () => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch prediction data
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        setLoading(true);
        // Assuming the backend provides an endpoint to get prediction results
        const response = await axios.get('/api/predict-fuel');
        if (response.data.success && response.data.data) {
          // Transform the data to match the expected format
          const formattedData = response.data.data.map((item, index) => ({
            id: index + 1,
            actualFuel: item.Actual_Fuel || 0,
            predictedFuel: item.Predicted_Fuel || 0,
            fuelError: item['Fuel_Error (%)'] || 0,
            actualCarbon: item.Actual_Carbon || 0,
            predictedCarbon: item.Predicted_Carbon || 0,
            carbonError: item['Carbon_Error (%)'] || 0,
          }));
          setPredictions(formattedData);
        } else {
          setError('No prediction data available');
        }
      } catch (err) {
        setError('Failed to fetch prediction data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

  // Handle running prediction
  const handleRunPrediction = async () => {
    try {
      setLoading(true);
      setError(null);
      await axios.post('/api/predict-fuel');
      // Re-fetch predictions after running
      const response = await axios.get('/api/predict-fuel');
      if (response.data.success && response.data.data) {
        const formattedData = response.data.data.map((item, index) => ({
          id: index + 1,
          actualFuel: item.Actual_Fuel || 0,
          predictedFuel: item.Predicted_Fuel || 0,
          fuelError: item['Fuel_Error (%)'] || 0,
          actualCarbon: item.Actual_Carbon || 0,
          predictedCarbon: item.Predicted_Carbon || 0,
          carbonError: item['Carbon_Error (%)'] || 0,
        }));
        setPredictions(formattedData);
      } else {
        setError('No prediction data available');
      }
    } catch (err) {
      setError('Failed to run prediction: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

    return (
      <Container className="my-5">
        <h2>Fuel Consumption and Carbon Emission Predictions</h2>
        <Button 
          variant="primary" 
          onClick={handleRunPrediction} 
          disabled={loading}
          className="mb-3"
        >
          {loading ? 'Running Prediction...' : 'Run Prediction'}
        </Button>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : predictions.length > 0 ? (
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Actual Fuel (kg)</th>
                  <th>Predicted Fuel (kg)</th>
                  <th>Fuel Error (%)</th>
                  <th>Actual Carbon (kg)</th>
                  <th>Predicted Carbon (kg)</th>
                  <th>Carbon Error (%)</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred) => (
                  <tr key={pred.id}>
                    <td>{pred.id}</td>
                    <td>{pred.actualFuel.toFixed(2)}</td>
                    <td>{pred.predictedFuel.toFixed(2)}</td>
                    <td>{pred.fuelError.toFixed(2)}</td>
                    <td>{pred.actualCarbon.toFixed(2)}</td>
                    <td>{pred.predictedCarbon.toFixed(2)}</td>
                    <td>{pred.carbonError.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        ) : (
          <Alert variant="info">No prediction data available. Click "Run Prediction" to generate new predictions.</Alert>
        )}
      </Container>
    );
};

export default FuelPrediction;
