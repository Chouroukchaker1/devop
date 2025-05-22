import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Alert, Table, Button, Form, Spinner } from 'react-bootstrap';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// List of countries for dropdowns (use uppercase to match table data)
const countries = [
  'FRANCE', 'GERMANY', 'ITALY', 'SPAIN', 'UNITED KINGDOM', 'UNITED STATES', 'CANADA',
  'AUSTRALIA', 'JAPAN', 'CHINA', 'INDIA', 'BRAZIL', 'RUSSIA', 'SOUTH AFRICA', 'TUNISIA'
];

function PredictionForm() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [showDashboards, setShowDashboards] = useState(false);
  const [departureCountry, setDepartureCountry] = useState('');
  const [arrivalCountry, setArrivalCountry] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch prediction data
  const fetchPrediction = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:8080/api/predict', {
        departureCountry,
        arrivalCountry
      });
      console.log('Raw API response:', response.data.data); // Debug log
      setResult(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la prédiction.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch disabled to wait for Eject or Search button
  }, []);

  // Sorting logic
  const sortData = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = () => {
    let data = result?.table || [];

    // Filter by departure and arrival countries if selected, normalize case
    if (departureCountry) {
      data = data.filter(row => 
        row['Departure Country']?.toUpperCase() === departureCountry.toUpperCase()
      );
    }
    if (arrivalCountry) {
      data = data.filter(row => 
        row['Arrival Country']?.toUpperCase() === arrivalCountry.toUpperCase()
      );
    }

    // Apply sorting if a sort key is selected
    if (sortConfig.key) {
      data = [...data].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'ascending' ? 1 : -1;
        return 0;
      });
    }

    return data;
  };

  const sortedData = getSortedData();

  // Chart data preparation
  const prepareChartData = (actualKey, predictedKey, label, colorActual, colorPredicted) => {
    const labels = sortedData?.map((_, idx) => `Point ${idx + 1}`) || [];
    const actualData = sortedData?.map(row => row[actualKey]) || [];
    const predictedData = sortedData?.map(row => row[predictedKey]) || [];

    return {
      labels,
      datasets: [
        {
          label: `Actual ${label}`,
          data: actualData,
          borderColor: colorActual,
          backgroundColor: colorActual,
          fill: false,
        },
        {
          label: `Predicted ${label}`,
          data: predictedData,
          borderColor: colorPredicted,
          backgroundColor: colorPredicted,
          fill: false,
        },
      ],
    };
  };

  const fuelChartData = prepareChartData(
    'Actual Fuel (tonnes)',
    'Predicted Fuel (tonnes)',
    'Fuel Consumption (tonnes)',
    'rgb(75, 192, 192)',
    'rgb(255, 99, 132)'
  );

  const carbonChartData = prepareChartData(
    'Actual CO2 (kg)',
    'Predicted CO2 (kg)',
    'CO2 Emissions (kg)',
    'rgb(54, 162, 235)',
    'rgb(255, 206, 86)'
  );

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: '' },
    },
    scales: {
      y: { beginAtZero: true },
    },
  };

  // Toggle dashboard visibility
  const toggleDashboards = () => {
    setShowDashboards(prev => !prev);
  };

  // Format error values to 5 decimal places
  const formatValue = (value) => {
    if (typeof value === 'number' && !Number.isInteger(value)) {
      return value.toFixed(5);
    }
    return value;
  };

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>Prédiction de consommation et émissions</h2>
        <div>
          <Button
            variant="primary"
            onClick={fetchPrediction}
            className="me-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                {' Chargement...'}
              </>
            ) : (
              'Rafraîchir'
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={toggleDashboards}
            disabled={loading}
          >
            {showDashboards ? 'Masquer les tableaux de bord' : 'Afficher les tableaux de bord'}
          </Button>
          <Button
            variant="danger"
            onClick={fetchPrediction}
            className="ms-2"
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                />
                {' Chargement...'}
              </>
            ) : (
              'Éjecter'
            )}
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <h4>Filtres de recherche</h4>
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Pays de départ</Form.Label>
            <Form.Control
              as="select"
              value={departureCountry}
              onChange={(e) => setDepartureCountry(e.target.value)}
            >
              <option value="">Sélectionner un pays</option>
              {countries.map((country, idx) => (
                <option key={idx} value={country}>{country}</option>
              ))}
            </Form.Control>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Pays d'arrivée</Form.Label>
            <Form.Control
              as="select"
              value={arrivalCountry}
              onChange={(e) => setArrivalCountry(e.target.value)}
            >
              <option value="">Sélectionner un pays</option>
              {countries.map((country, idx) => (
                <option key={idx} value={country}>{country}</option>
              ))}
            </Form.Control>
          </Form.Group>
          <Button
            variant="outline-primary"
            onClick={fetchPrediction}
            disabled={loading || (!departureCountry && !arrivalCountry)}
            className="d-flex align-items-center"
          >
            <Search size={16} className="me-2" />
            {loading ? 'Chargement...' : 'Rechercher'}
          </Button>
        </Form>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </Spinner>
        </div>
      )}

      {showDashboards && sortedData?.length > 0 && (
        <>
          <div className="mt-4">
            <h4>Tableau de bord - Consommation de carburant</h4>
            <Line
              data={fuelChartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: { ...chartOptions.plugins.title, text: 'Consommation de carburant (Actuel vs Prédit, tonnes)' },
                },
              }}
            />
          </div>

          <div className="mt-4">
            <h4>Tableau de bord - Émissions de carbone</h4>
            <Line
              data={carbonChartData}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: { ...chartOptions.plugins.title, text: 'Émissions de CO2 (Actuel vs Prédit, kg)' },
                },
              }}
            />
          </div>
        </>
      )}

      {result?.table?.length > 0 && sortedData?.length > 0 && (
        <div className="mt-4">
          <h4>Tableau des résultats détaillés</h4>
          <div className="table-responsive">
            <Table bordered hover className="sortable-table">
              <thead>
                <tr>
                  {Object.keys(result.table[0]).map((col, idx) => (
                    <th key={idx} onClick={() => sortData(col)} className="sortable-header">
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{col}</span>
                        <div className="sort-icons">
                          {sortConfig.key === col ? (
                            sortConfig.direction === 'ascending' ? (
                              <ChevronUp size={16} className="sort-icon active" />
                            ) : (
                              <ChevronDown size={16} className="sort-icon active" />
                            )
                          ) : (
                            <>
                              <ChevronUp size={16} className="sort-icon" />
                              <ChevronDown size={16} className="sort-icon" />
                            </>
                          )}
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row, i) => (
                  <tr key={i}>
                    {Object.values(row).map((value, j) => (
                      <td key={j}>{formatValue(value)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}

      {result?.table?.length > 0 && sortedData?.length === 0 && (
        <Alert variant="info">Aucune donnée trouvée pour les pays sélectionnés.</Alert>
      )}

      <style jsx>{`
        .sortable-header {
          cursor: pointer;
          user-select: none;
          background-color: #f8f9fa;
          padding: 0.75rem;
        }
        .sortable-header:hover {
          background-color: #e9ecef;
        }
        .sort-icons {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-left: 5px;
        }
        .sort-icon {
          color: #adb5bd;
          margin: -3px 0;
        }
        .sort-icon.active {
          color: #0d6efd;
        }
        .table-responsive {
          max-height: 500px;
          overflow-y: auto;
        }
        .sortable-table thead th {
          position: sticky;
          top: 0;
          background-color: #f8f9fa;
          z-index: 1;
        }
      `}</style>
    </Container>
  );
}

export default PredictionForm;