import React, { useState, useContext } from 'react';
import axios from 'axios';
import { ThemeContext } from '../App';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Download, BarChart2, AlertCircle, CheckCircle, Loader, FileText } from 'lucide-react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './FuelPrediction.css'; // Assuming a CSS file for custom styles

const FuelPrediction = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const [predictionData, setPredictionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [sortBy, setSortBy] = useState('index');
  const [formData, setFormData] = useState({
    AirDistance: '',
    DepartureAirport: '',
    ArrivalAirport: '',
    TaxiFuel: '',
    ContingencyFuel: '',
    AlternateFuel: '',
  });
  const [realTimePrediction, setRealTimePrediction] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRealTimePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setRealTimePrediction(null);

    try {
      const token = localStorage.getItem('token') || 'dummy-token';
      const response = await axios.post(
        'http://localhost:8082/api/predict',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        setRealTimePrediction(response.data.data);
        setSuccessMessage('Real-time prediction completed successfully!');
      } else {
        throw new Error(response.data.message || 'Real-time prediction failed');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error during real-time prediction';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    setPredictionData(null);

    try {
      const token = localStorage.getItem('token') || 'dummy-token';
      const response = await axios.post(
        'http://localhost:8082/api/predict-fuel',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success && response.data.data?.comparison) {
        setPredictionData(response.data.data.comparison);
        setSuccessMessage('Batch prediction completed successfully!');
      } else {
        throw new Error(response.data.message || 'No valid prediction data received');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Unable to connect to the prediction service';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setError(null);
    setSuccessMessage(null);

    try {
      const token = localStorage.getItem('token') || 'dummy-token';
      const response = await axios.get('http://localhost:8082/api/download/prediction-results', {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `prediction_results_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setSuccessMessage('Prediction results downloaded successfully!');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Error downloading prediction results';
      setError(errorMessage);
    }
  };

  const chartData = predictionData
    ? Object.entries(predictionData).map(([index, item]) => ({
        name: `Flight ${parseInt(index) + 1}`,
        Actual_Fuel: item.Actual_Fuel ?? 0,
        Predicted_Fuel: item.Predicted_Fuel ?? 0,
      }))
    : [];

  const pieData = predictionData
    ? [
        {
          name: '<1%',
          value: Object.values(predictionData).filter((item) => Math.abs(item['Fuel_Error (%)'] ?? 0) < 1).length,
        },
        {
          name: '1-3%',
          value: Object.values(predictionData).filter(
            (item) => Math.abs(item['Fuel_Error (%)'] ?? 0) >= 1 && Math.abs(item['Fuel_Error (%)'] ?? 0) <= 3
          ).length,
        },
        {
          name: '3-5%',
          value: Object.values(predictionData).filter(
            (item) => Math.abs(item['Fuel_Error (%)'] ?? 0) > 3 && Math.abs(item['Fuel_Error (%)'] ?? 0) <= 5
          ).length,
        },
        {
          name: '>5%',
          value: Object.values(predictionData).filter((item) => Math.abs(item['Fuel_Error (%)'] ?? 0) > 5).length,
        },
      ].filter((item) => item.value > 0)
    : [];

  const PIE_COLORS = ['#28a745', '#007bff', '#ffc107', '#dc3545'];

  const stats = predictionData
    ? {
        totalSamples: Object.keys(predictionData).length,
        averageError: (
          Object.values(predictionData).reduce((acc, item) => acc + Math.abs(item['Fuel_Error (%)'] ?? 0), 0) /
          Object.keys(predictionData).length
        ).toFixed(2),
        maxError: Math.max(...Object.values(predictionData).map((item) => Math.abs(item['Fuel_Error (%)'] ?? 0))).toFixed(2),
        minError: Math.min(...Object.values(predictionData).map((item) => Math.abs(item['Fuel_Error (%)'] ?? 0))).toFixed(2),
        medianError: (() => {
          const sortedErrors = Object.values(predictionData)
            .map((item) => Math.abs(item['Fuel_Error (%)'] ?? 0))
            .sort((a, b) => a - b);
          const mid = Math.floor(sortedErrors.length / 2);
          return sortedErrors.length % 2 === 0
            ? ((sortedErrors[mid - 1] + sortedErrors[mid]) / 2).toFixed(2)
            : sortedErrors[mid].toFixed(2);
        })(),
      }
    : null;

  const getStatusColor = (error) => {
    const absError = Math.abs(error ?? 0);
    if (absError <= 1) return 'text-success';
    if (absError <= 3) return 'text-primary';
    if (absError <= 5) return 'text-warning';
    return 'text-danger';
  };

  const sortedPredictionData = predictionData
    ? Object.entries(predictionData).sort((a, b) => {
        if (sortBy === 'index') {
          return parseInt(a[0]) - parseInt(b[0]);
        } else if (sortBy === 'Fuel_Error') {
          return Math.abs(b[1]['Fuel_Error (%)'] ?? 0) - Math.abs(a[1]['Fuel_Error (%)'] ?? 0);
        }
        return 0;
      })
    : [];

  return (
    <div className={`container-fluid py-4 ${isDarkMode ? 'bg-dark text-white' : 'bg-light text-dark'}`}>
      <div className="container">
        <header className="mb-5">
          <h1 className="display-4 fw-bold">Fuel Prediction Dashboard</h1>
          <p className="lead text-muted">Predict and analyze fuel consumption and carbon emissions for flights.</p>
        </header>

        {successMessage && (
          <div className="alert alert-success d-flex align-items-center mb-5" role="alert">
            <CheckCircle className="me-2" size={24} />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-5" role="alert">
            <AlertCircle className="me-2" size={24} />
            <span>{error}</span>
          </div>
        )}

        <div className={`card mb-5 ${isDarkMode ? 'bg-secondary text-white' : 'bg-white'}`}>
          <div className="card-body">
            <h2 className="card-title h4 mb-3 d-flex align-items-center">
              <FileText className="me-2" size={24} />
              Real-Time Prediction
            </h2>
            <p className="card-text text-muted mb-4">Enter flight details to predict fuel and carbon emissions.</p>
            <form onSubmit={handleRealTimePredict}>
              <div className="row">
                {Object.keys(formData).map((key) => (
                  <div className="col-md-4 mb-3" key={key}>
                    <label htmlFor={key} className="form-label">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <input
                      type={key === 'AirDistance' || key.includes('Fuel') ? 'number' : 'text'}
                      className={`form-control ${isDarkMode ? 'bg-secondary text-light' : ''}`}
                      id={key}
                      name={key}
                      value={formData[key]}
                      onChange={handleChange}
                      placeholder={`Enter ${key.replace(/([A-Z])/g, ' $1').trim()}`}
                      required
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className={`btn ${isDarkMode ? 'btn-outline-light' : 'btn-primary'}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader className="me-2 animate-spin" size={20} />
                    Predicting...
                  </>
                ) : (
                  'Predict'
                )}
              </button>
            </form>
            {realTimePrediction && (
              <div className="mt-4">
                <h3 className="h5">Prediction Results</h3>
                <table className={`table ${isDarkMode ? 'table-dark' : 'table-light'}`}>
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th className="text-end">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Predicted Fuel Consumption</td>
                      <td className="text-end">{realTimePrediction.fuel ? `${realTimePrediction.fuel.toFixed(2)} kg` : 'N/A'}</td>
                    </tr>
                    <tr>
                      <td>Predicted Carbon Emission</td>
                      <td className="text-end">{realTimePrediction.carbon ? `${realTimePrediction.carbon.toFixed(2)} kg` : 'N/A'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className={`card mb-5 ${isDarkMode ? 'bg-secondary text-white' : 'bg-white'}`}>
          <div className="card-body">
            <h2 className="card-title h4 mb-3 d-flex align-items-center">
              <FileText className="me-2" size={24} />
              Batch Predictions
            </h2>
            <p className="card-text text-muted mb-4">Run predictions for all flights or download results.</p>
            <div className="d-flex flex-column flex-md-row gap-3">
              <button
                onClick={handlePredict}
                disabled={loading}
                className={`btn btn-primary w-100 w-md-auto d-flex align-items-center justify-content-center ${
                  loading ? 'disabled' : ''
                }`}
              >
                {loading ? (
                  <>
                    <Loader className="me-2 animate-spin" size={20} />
                    Loading Predictions...
                  </>
                ) : (
                  'Run Batch Predictions'
                )}
              </button>
              <button
                onClick={handleDownload}
                className="btn btn-success w-100 w-md-auto d-flex align-items-center justify-content-center"
                disabled={!predictionData}
              >
                <Download className="me-2" size={18} />
                Download Results
              </button>
            </div>
          </div>
        </div>

        {stats && (
          <div className={`card mb-5 ${isDarkMode ? 'bg-secondary text-white' : 'bg-white'}`}>
            <div className="card-body">
              <h2 className="card-title h4 mb-3 d-flex align-items-center">
                <BarChart2 className="me-2" size={24} />
                Prediction Statistics
              </h2>
              <p className="card-text text-muted mb-4">Summary of batch prediction accuracy.</p>
              <div className="row g-4">
                <div className="col-md-2 col-6">
                  <div className="p-3 bg-light rounded text-center">
                    <p className="mb-1 small">Total Flights</p>
                    <p className="h5 mb-0">{stats.totalSamples}</p>
                  </div>
                </div>
                <div className="col-md-2 col-6">
                  <div className="p-3 bg-light rounded text-center">
                    <p className="mb-1 small">Average Error</p>
                    <p className="h5 mb-0">{stats.averageError}%</p>
                  </div>
                </div>
                <div className="col-md-2 col-6">
                  <div className="p-3 bg-light rounded text-center">
                    <p className="mb-1 small">Median Error</p>
                    <p className="h5 mb-0">{stats.medianError}%</p>
                  </div>
                </div>
                <div className="col-md-2 col-6">
                  <div className="p-3 bg-light rounded text-center">
                    <p className="mb-1 small">Minimum Error</p>
                    <p className="h5 mb-0">{stats.minError}%</p>
                  </div>
                </div>
                <div className="col-md-2 col-6">
                  <div className="p-3 bg-light rounded text-center">
                    <p className="mb-1 small">Maximum Error</p>
                    <p className="h5 mb-0">{stats.maxError}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {sortedPredictionData.length > 0 && (
          <div className={`card mb-5 ${isDarkMode ? 'bg-secondary text-white' : 'bg-white'}`}>
            <div className="card-body">
              <h2 className="card-title h4 mb-3 d-flex align-items-center">
                <FileText className="me-2" size={24} />
                Batch Prediction Results
              </h2>
              <p className="card-text text-muted mb-4">Detailed fuel and carbon emission predictions.</p>
              <div className="mb-4">
                <label htmlFor="sortSelect" className="form-label">
                  Sort by:
                </label>
                <select
                  id="sortSelect"
                  className="form-select w-auto"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="index">Flight Index</option>
                  <option value="Fuel_Error">Fuel Error (%)</option>
                </select>
              </div>
              <div className="table-responsive">
                <table className={`table ${isDarkMode ? 'table-dark' : 'table-light'} table-hover`}>
                  <thead>
                    <tr>
                      <th scope="col">Flight Index</th>
                      <th scope="col" className="text-end">Actual Fuel (kg)</th>
                      <th scope="col" className="text-end">Predicted Fuel (kg)</th>
                      <th scope="col" className="text-end">Fuel Error (%)</th>
                      <th scope="col" className="text-end">Actual Carbon (kg)</th>
                      <th scope="col" className="text-end">Predicted Carbon (kg)</th>
                      <th scope="col" className="text-end">Carbon Error (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPredictionData.map(([index, row]) => (
                      <tr key={index}>
                        <td>{parseInt(index) + 1}</td>
                        <td className="text-end">{(row.Actual_Fuel ?? 0).toFixed(2)}</td>
                        <td className="text-end">{(row.Predicted_Fuel ?? 0).toFixed(2)}</td>
                        <td className={`text-end ${getStatusColor(row['Fuel_Error (%)'])}`}>
                          {(row['Fuel_Error (%)'] ?? 0).toFixed(2)}%
                        </td>
                        <td className="text-end">{(row.Actual_Carbon ?? 0).toFixed(2)}</td>
                        <td className="text-end">{(row.Predicted_Carbon ?? 0).toFixed(2)}</td>
                        <td className={`text-end ${getStatusColor(row['Carbon_Error (%)'])}`}>
                          {(row['Carbon_Error (%)'] ?? 0).toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {pieData.length > 0 && (
          <div className={`card mb-5 ${isDarkMode ? 'bg-secondary text-white' : 'bg-white'}`}>
            <div className="card-body">
              <h2 className="card-title h4 mb-3">Fuel Error Distribution</h2>
              <p className="card-text text-muted mb-4">Distribution of prediction errors for fuel consumption.</p>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDarkMode ? '#333' : '#fff',
                        color: isDarkMode ? '#fff' : '#333',
                        border: `1px solid ${isDarkMode ? '#555' : '#ddd'}`,
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {chartData.length > 0 && (
          <div className={`card mb-5 ${isDarkMode ? 'bg-secondary text-white' : 'bg-white'}`}>
            <div className="card-body">
              <h2 className="card-title h4 mb-3">Fuel Consumption Comparison</h2>
              <p className="card-text text-muted mb-4">Comparison of actual vs. predicted fuel consumption.</p>
              <div style={{ height: '400px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis label={{ value: 'Fuel (kg)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Legend verticalAlign="top" height={36} />
                    <Bar dataKey="Actual_Fuel" fill="#007bff" name="Actual Fuel" />
                    <Bar dataKey="Predicted_Fuel" fill="#28a745" name="Predicted Fuel" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuelPrediction;