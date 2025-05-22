import React, { useState, useContext } from 'react';
import { Container, Button, Card, Table, Alert, Spinner, Image } from 'react-bootstrap';
import axios from 'axios';
import { Tooltip } from 'react-tooltip';
import { ThemeContext } from '../App';
import 'bootstrap/dist/css/bootstrap.min.css';

const CO2Prediction = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [predictionData, setPredictionData] = useState(null);
  const [plotUrl, setPlotUrl] = useState(null);
  const [totalEmissions, setTotalEmissions] = useState(null);
  const [avgError, setAvgError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setPredictionData(null);
    setPlotUrl(null);
    setTotalEmissions(null);
    setAvgError(null);

    try {
      const response = await axios.post('http://localhost:8080/api/predict-co2');
      if (response.data.success) {
        setPredictionData(response.data.comparison);
        setPlotUrl(response.data.plotUrl ? `http://localhost:8080${response.data.plotUrl}` : null);
        setTotalEmissions(response.data.total_emissions_kg);
        setAvgError(response.data.average_prediction_error_percent);
      } else {
        setError(response.data.message || 'Failed to fetch CO2 prediction results.');
      }
    } catch (err) {
      setError('Error connecting to the server. Please try again later.');
      console.error('CO2 Prediction error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <h1 className="text-center mb-4">CO2 Emissions Prediction</h1>
      <p className="text-center mb-4">
        Click the button below to predict CO2 emissions for your flights. The results will show how much CO2 your flights actually emitted compared to our predictions, helping you comply with environmental regulations and reduce your carbon footprint.
      </p>

      {/* Predict Button */}
      <div className="text-center mb-4">
        <Button
          variant="success"
          size="lg"
          onClick={handlePredict}
          disabled={loading}
          data-tooltip-id="predict-tooltip"
          data-tooltip-content="Click to run the CO2 emissions prediction model for your flight data."
          className={isDarkMode ? 'btn-dark' : ''}
        >
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> Running...
            </>
          ) : (
            'Run CO2 Prediction'
          )}
        </Button>
        <Tooltip id="predict-tooltip" />
      </div>

      {/* Error Message */}
      {error && (
        <Alert variant="danger" className="mt-4">
          <strong>Error:</strong> {error}
        </Alert>
      )}

      {/* Aggregate Statistics */}
      {(totalEmissions || avgError) && (
        <Card className={`mt-4 ${isDarkMode ? 'bg-dark text-light' : ''}`}>
          <Card.Body>
            <Card.Title>Summary Statistics</Card.Title>
            <Card.Text>
              <ul>
                {totalEmissions && (
                  <li>
                    <strong>Total CO2 Emissions:</strong> {totalEmissions.toFixed(2)} kg
                    <span data-tooltip-id="total-tooltip" data-tooltip-content="Total actual CO2 emissions for all flights analyzed.">
                      {' '}
                      ℹ️
                    </span>
                  </li>
                )}
                {avgError && (
                  <li>
                    <strong>Average Prediction Error:</strong> {avgError.toFixed(2)}%
                    <span data-tooltip-id="avg-error-tooltip" data-tooltip-content="Average percentage error in predictions, indicating model accuracy.">
                      {' '}
                      ℹ️
                    </span>
                  </li>
                )}
              </ul>
            </Card.Text>
            <Tooltip id="total-tooltip" />
            <Tooltip id="avg-error-tooltip" />
          </Card.Body>
        </Card>
      )}

      {/* Prediction Results */}
      {predictionData && (
        <Card className={`mt-4 ${isDarkMode ? 'bg-dark text-light' : ''}`}>
          <Card.Body>
            <Card.Title>CO2 Prediction Results</Card.Title>
            <Card.Text>
              The table below compares the actual CO2 emissions from your flights to the predicted emissions. Use this data to monitor compliance with regulations like EU ETS and CORSIA.
            </Card.Text>
            <Table striped bordered hover responsive variant={isDarkMode ? 'dark' : 'light'}>
              <thead>
                <tr>
                  <th
                    data-tooltip-id="flight-number-tooltip"
                    data-tooltip-content="Unique identifier for each flight."
                  >
                    Flight Number
                  </th>
                  <th
                    data-tooltip-id="date-tooltip"
                    data-tooltip-content="Date the flight occurred."
                  >
                    Date
                  </th>
                  <th
                    data-tooltip-id="actual-tooltip"
                    data-tooltip-content="Actual CO2 emissions (in kg) produced by the flight."
                  >
                    Actual CO2 (kg)
                  </th>
                  <th
                    data-tooltip-id="predicted-tooltip"
                    data-tooltip-content="CO2 emissions (in kg) predicted by our model."
                  >
                    Predicted CO2 (kg)
                  </th>
                  <th
                    data-tooltip-id="difference-tooltip"
                    data-tooltip-content="Difference (in kg) between actual and predicted emissions."
                  >
                    Difference (kg)
                  </th>
                  <th
                    data-tooltip-id="error-tooltip"
                    data-tooltip-content="Percentage error in the prediction, showing how close the prediction was to the actual value."
                  >
                    Error (%)
                  </th>
                </tr>
              </thead>
              <tbody>
                {predictionData.map((row, index) => (
                  <tr key={index}>
                    <td>{row['Flight Number']}</td>
                    <td>{row['Date of Flight']}</td>
                    <td>{row.Actual.toFixed(2)}</td>
                    <td>{row.Predicted.toFixed(2)}</td>
                    <td>{row.Difference.toFixed(2)}</td>
                    <td>{row['Error (%)'].toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Tooltip id="flight-number-tooltip" />
            <Tooltip id="date-tooltip" />
            <Tooltip id="actual-tooltip" />
            <Tooltip id="predicted-tooltip" />
            <Tooltip id="difference-tooltip" />
            <Tooltip id="error-tooltip" />
          </Card.Body>
        </Card>
      )}

      {/* Analysis Plot */}
      {plotUrl && (
        <Card className={`mt-4 ${isDarkMode ? 'bg-dark text-light' : ''}`}>
          <Card.Body>
            <Card.Title>CO2 Emissions Analysis Plot</Card.Title>
            <Card.Text>
              This chart helps you understand prediction accuracy. The scatter plot compares actual vs. predicted emissions, histograms show prediction errors, and the bar chart identifies key factors (e.g., fuel usage, aircraft type) affecting emissions.
            </Card.Text>
            <Image src={plotUrl} fluid alt="CO2 Emissions Analysis Plot" />
          </Card.Body>
        </Card>
      )}
    </Container>
  );
};

export default CO2Prediction;