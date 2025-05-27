import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner, Card } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaSyncAlt, FaPlane } from 'react-icons/fa';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

// Custom CSS (unchanged)
const customStyles = `
  .fuel-management-container {
    padding: 1.5rem;
    background-color: #f8f9fa;
    min-height: 100vh;
  }
  
  .page-title {
    color: #2c3e50;
    margin-bottom: 1.5rem;
    font-weight: 600;
    border-bottom: 2px solid #3498db;
    padding-bottom: 0.5rem;
    display: flex;
    align-items: center;
  }
  
  .page-title-icon {
    margin-right: 0.75rem;
    color: #3498db;
  }
  
  .fuel-table-card {
    border: none;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 2rem;
    overflow: hidden;
  }
  
  .fuel-table {
    margin-bottom: 0;
  }
  
  .fuel-table thead {
    background-color: #3498db;
    color: white;
  }
  
  .fuel-table thead th {
    font-weight: 500;
    border-bottom: none;
    text-align: center;
    vertical-align: middle;
    padding: 0.75rem;
    white-space: nowrap;
  }
  
  .fuel-table tbody tr:hover {
    background-color: rgba(52, 152, 219, 0.05);
  }
  
  .fuel-table td {
    vertical-align: middle;
    font-size: 0.9rem;
    text-align: center;
    white-space: nowrap;
    color: #000000;
    font-weight: 400;
  }
  
  .actions-cell {
    white-space: nowrap;
    width: 120px;
  }
  
  .action-btn {
    padding: 0.25rem 0.5rem;
    font-size: 1rem;
  }
  
  .actions-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }
  
  .add-fuel-btn {
    background-color: #2ecc71;
    border-color: #2ecc71;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .add-fuel-btn:hover {
    background-color: #27ae60;
    border-color: #27ae60;
  }
  
  .refresh-btn {
    background-color: #3498db;
    border-color: #3498db;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .refresh-btn:hover {
    background-color: #2980b9;
    border-color: #2980b9;
  }
  
  .success-alert {
    animation: fadeOut 5s forwards;
    position: fixed;
    top: 20px;
    right: #20px;
    z-index: 1050;
    min-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-left: 4px solid #2ecc71;
  }
  
  .error-alert {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1050;
    min-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    border-left: 4px solid #e74c3c;
  }
  
  .no-data-message {
    text-align: center;
    padding: 2rem;
    color: #6c757d;
  }
  
  @keyframes fadeOut {
    0% { opacity: 1; }
    70% { opacity: 1; }
    100% { opacity: 0; visibility: hidden; }
  }
  
  .modal-header {
    background-color: #3498db;
    color: white;
    border-bottom: none;
  }
  
  .modal-title {
    font-weight: 600;
  }
  
  .btn-close {
    filter: brightness(0) invert(1);
  }
  
  .flight-number-cell {
    font-weight: 600;
  }
  
  .form-label {
    font-weight: 500;
    color: #2c3e50;
  }
`;

const FuelList = () => {
  const [fuelData, setFuelData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentFuel, setCurrentFuel] = useState(null);
  const [formData, setFormData] = useState({
    dateOfFlight: '',
    timeOfDeparture: '',
    flightNumber: '',
    departureAirport: '',
    arrivalAirport: '',
    taxiFuel: '',
    tripFuel: '',
    contingencyFuel: '',
    blockFuel: '',
    finalReserve: '',
    additionalFuel: '',
    fuelForOtherSafetyRules: '',
    discretionaryFuel: '',
    extraFuel: '',
    reason: '',
    economicTankeringCategory: '',
    alternateFuel: '',
    alternateArrivalAirport: '',
    fob: '',
    blockOn: '',
    blockOff: '',
    upliftVolume: '',
    upliftDensity: '',
    pilotId: '',
    carbonEmission: ''
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fuelToDelete, setFuelToDelete] = useState(null);

  const token = localStorage.getItem('token');
  const rawUserRole = localStorage.getItem('userRole');
  const userRole = rawUserRole ? rawUserRole.toLowerCase().trim() : null; // Normalize role
  console.log('userRole:', userRole); // Debug: Verify userRole value

  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  // Define allowed roles for add, edit, and delete actions
  const allowedRoles = ['admin', 'fueldatamaster', 'fueluser'];

  useEffect(() => {
    fetchFuelData();
  }, []);

  const fetchFuelData = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:8082/api/feuldata', axiosConfig);
      if (response.data.success) {
        // Normalize carbonEmission to handle case variations and missing values
        const normalizedData = response.data.data.map((item) => ({
          ...item,
          carbonEmission: item.carbonEmission ?? item.CarbonEmission ?? 0 // Fallback to 0 if undefined
        }));
        setFuelData(normalizedData);
      } else {
        setError('Failed to fetch fuel data');
      }
    } catch (err) {
      setError('Server error: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddFuel = () => {
    setCurrentFuel(null);
    setFormData({
      dateOfFlight: new Date().toISOString().split('T')[0],
      timeOfDeparture: '',
      flightNumber: '',
      departureAirport: '',
      arrivalAirport: '',
      taxiFuel: '',
      tripFuel: '',
      contingencyFuel: '',
      blockFuel: '',
      finalReserve: '',
      additionalFuel: '',
      fuelForOtherSafetyRules: '',
      discretionaryFuel: '',
      extraFuel: '',
      reason: '',
      economicTankeringCategory: '',
      alternateFuel: '',
      alternateArrivalAirport: '',
      fob: '',
      blockOn: '',
      blockOff: '',
      upliftVolume: '',
      upliftDensity: '',
      pilotId: '',
      carbonEmission: ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleEditFuel = (fuel) => {
    const fuelDateOnly = fuel.dateOfFlight ? new Date(fuel.dateOfFlight).toISOString().split('T')[0] : '';
    setCurrentFuel(fuel);
    setFormData({
      dateOfFlight: fuelDateOnly,
      timeOfDeparture: fuel.timeOfDeparture || '',
      flightNumber: fuel.flightNumber || '',
      departureAirport: fuel.departureAirport || '',
      arrivalAirport: fuel.arrivalAirport || '',
      taxiFuel: fuel.taxiFuel?.toString() || '',
      tripFuel: fuel.tripFuel?.toString() || '',
      contingencyFuel: fuel.contingencyFuel?.toString() || '',
      blockFuel: fuel.blockFuel?.toString() || '',
      finalReserve: fuel.finalReserve?.toString() || '',
      additionalFuel: fuel.additionalFuel?.toString() || '',
      fuelForOtherSafetyRules: fuel.fuelForOtherSafetyRules?.toString() || '',
      discretionaryFuel: fuel.discretionaryFuel?.toString() || '',
      extraFuel: fuel.extraFuel?.toString() || '',
      reason: fuel.reason || '',
      economicTankeringCategory: fuel.economicTankeringCategory || '',
      alternateFuel: fuel.alternateFuel?.toString() || '',
      alternateArrivalAirport: fuel.alternateArrivalAirport || '',
      fob: fuel.fob?.toString() || '',
      blockOn: fuel.blockOn?.toString() || '',
      blockOff: fuel.blockOff?.toString() || '',
      upliftVolume: fuel.upliftVolume?.toString() || '',
      upliftDensity: fuel.upliftDensity?.toString() || '',
      pilotId: fuel.pilotId || '',
      carbonEmission: fuel.carbonEmission?.toString() || ''
    });
    setFormError('');
    setShowModal(true);
  };

  const validateForm = () => {
    const requiredFields = [
      'dateOfFlight',
      'timeOfDeparture',
      'flightNumber',
      'departureAirport',
      'arrivalAirport'
    ];
    for (const field of requiredFields) {
      if (!formData[field] || formData[field].trim() === '') {
        setFormError(`Please fill the required field: ${field}`);
        return false;
      }
    }

    const numericFields = [
      'taxiFuel',
      'tripFuel',
      'contingencyFuel',
      'blockFuel',
      'finalReserve',
      'additionalFuel',
      'fuelForOtherSafetyRules',
      'discretionaryFuel',
      'extraFuel',
      'alternateFuel',
      'fob',
      'blockOn',
      'blockOff',
      'upliftVolume',
      'upliftDensity',
      'carbonEmission'
    ];
    for (const field of numericFields) {
      if (formData[field] && isNaN(Number(formData[field]))) {
        setFormError(`${field} must be a valid number`);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!validateForm()) {
      return;
    }

    try {
      const dataToSubmit = {
        dateOfFlight: formData.dateOfFlight,
        timeOfDeparture: formData.timeOfDeparture.trim(),
        flightNumber: formData.flightNumber.trim(),
        departureAirport: formData.departureAirport.trim(),
        arrivalAirport: formData.arrivalAirport.trim(),
        taxiFuel: formData.taxiFuel ? parseFloat(formData.taxiFuel) : 0,
        tripFuel: formData.tripFuel ? parseFloat(formData.tripFuel) : 0,
        contingencyFuel: formData.contingencyFuel ? parseFloat(formData.contingencyFuel) : 0,
        blockFuel: formData.blockFuel ? parseFloat(formData.blockFuel) : 0,
        finalReserve: formData.finalReserve ? parseFloat(formData.finalReserve) : 0,
        additionalFuel: formData.additionalFuel ? parseFloat(formData.additionalFuel) : 0,
        fuelForOtherSafetyRules: formData.fuelForOtherSafetyRules ? parseFloat(formData.fuelForOtherSafetyRules) : 0,
        discretionaryFuel: formData.discretionaryFuel ? parseFloat(formData.discretionaryFuel) : 0,
        extraFuel: formData.extraFuel ? parseFloat(formData.extraFuel) : 0,
        reason: formData.reason?.trim() || '',
        economicTankeringCategory: formData.economicTankeringCategory?.trim() || '',
        alternateFuel: formData.alternateFuel ? parseFloat(formData.alternateFuel) : 0,
        alternateArrivalAirport: formData.alternateArrivalAirport?.trim() || '',
        fob: formData.fob ? parseFloat(formData.fob) : 0,
        blockOn: formData.blockOn ? parseFloat(formData.blockOn) : 0,
        blockOff: formData.blockOff ? parseFloat(formData.blockOff) : 0,
        upliftVolume: formData.upliftVolume ? parseFloat(formData.upliftVolume) : 0,
        upliftDensity: formData.upliftDensity ? parseFloat(formData.upliftDensity) : 0,
        carbonEmission: formData.carbonEmission ? parseFloat(formData.carbonEmission) : 0,
        pilotId: formData.pilotId?.trim() || ''
      };

      let response;
      if (currentFuel) {
        response = await axios.put(
          `http://localhost:8082/api/feuldata/${currentFuel._id}`,
          dataToSubmit,
          axiosConfig
        );
      } else {
        response = await axios.post(
          'http://localhost:8082/api/feuldata',
          dataToSubmit,
          axiosConfig
        );
      }

      if (response.data.success) {
        setShowModal(false);
        setSuccessMessage(currentFuel ? 'Fuel data updated successfully!' : 'Fuel data added successfully!');
        fetchFuelData();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setFormError(response.data.message || 'An error occurred');
      }
    } catch (err) {
      console.error("Error details:", err.response?.data || err);
      if (err.response && err.response.data && err.response.data.errors) {
        const errorMessages = err.response.data.errors
          .map(e => e.msg || e.message)
          .join(', ');
        setFormError('Validation errors: ' + errorMessages);
      } else {
        setFormError('Error: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const confirmDelete = (fuel) => {
    setFuelToDelete(fuel);
    setShowDeleteModal(true);
  };

  const handleDeleteFuel = async () => {
    if (!fuelToDelete) return;

    try {
      const response = await axios.delete(
        `http://localhost:8082/api/feuldata/${fuelToDelete._id}`,
        axiosConfig
      );

      if (response.data.success) {
        setShowDeleteModal(false);
        setSuccessMessage('Fuel data deleted successfully!');
        fetchFuelData();
        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        setError(response.data.message || 'Failed to delete');
      }
    } catch (err) {
      setError('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      <style>{customStyles}</style>
      
      <div className="fuel-management-container">
        <h1 className="page-title">
          <FaPlane className="page-title-icon" /> Fuel Data Management
        </h1>

        {successMessage && (
          <Alert variant="success" className="success-alert">
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" className="error-alert">
            {error}
            <Button
              variant="outline-danger"
              size="sm"
              className="ms-2"
              onClick={() => setError('')}
            >
              Close
            </Button>
          </Alert>
        )}

        <div className="actions-container">
          {allowedRoles.includes(userRole) && (
            <Button
              variant="primary"
              className="add-fuel-btn"
              onClick={handleAddFuel}
            >
              <FaPlus /> Ajouter Fuel Data
            </Button>
          )}
          <Button
            variant="secondary"
            className="refresh-btn"
            onClick={fetchFuelData}
          >
            <FaSyncAlt /> Rafraîchir
          </Button>
        </div>

        <Card className="fuel-table-card">
          <Card.Body>
            {loading ? (
              <div className="text-center my-4">
                <Spinner animation="border" variant="primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-2">Loading fuel data...</p>
              </div>
            ) : fuelData.length === 0 ? (
              <div className="no-data-message">
                <p>No fuel data found. Click "Add Fuel Data" to start.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover className="fuel-table">
                  <thead>
                    <tr>
                      <th>Date of Flight</th>
                      <th>Time of Departure</th>
                      <th>Flight Number</th>
                      <th>Departure Airport</th>
                      <th>Arrival Airport</th>
                      <th>Taxi Fuel</th>
                      <th>Trip Fuel</th>
                      <th>Contingency Fuel</th>
                      <th>Block Fuel</th>
                      <th>Final Reserve</th>
                      <th>Additional Fuel (tonnes)</th>
                      <th>Fuel for Other Safety Rules (tonnes)</th>
                      <th>Discretionary Fuel</th>
                      <th>Extra Fuel</th>
                      <th>Reason</th>
                      <th>Economic Tankering Category</th>
                      <th>Alternate Fuel</th>
                      <th>Alternate Arrival Airport</th>
                      <th>FOB</th>
                      <th>Carbon Emission (kg)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fuelData.map((fuel) => (
                      <tr key={fuel._id}>
                        <td>{fuel.dateOfFlight ? new Date(fuel.dateOfFlight).toLocaleDateString() : ''}</td>
                        <td>{fuel.timeOfDeparture || ''}</td>
                        <td className="flight-number-cell">{fuel.flightNumber}</td>
                        <td>{fuel.departureAirport}</td>
                        <td>{fuel.arrivalAirport}</td>
                        <td>{fuel.taxiFuel}</td>
                        <td>{fuel.tripFuel}</td>
                        <td>{fuel.contingencyFuel}</td>
                        <td>{fuel.blockFuel}</td>
                        <td>{fuel.finalReserve}</td>
                        <td>{fuel.additionalFuel}</td>
                        <td>{fuel.fuelForOtherSafetyRules}</td>
                        <td>{fuel.discretionaryFuel}</td>
                        <td>{fuel.extraFuel}</td>
                        <td>{fuel.reason || ''}</td>
                        <td>{fuel.economicTankeringCategory || ''}</td>
                        <td>{fuel.alternateFuel}</td>
                        <td>{fuel.alternateArrivalAirport || ''}</td>
                        <td>{fuel.fob}</td>
                        <td>{fuel.carbonEmission}</td>
                        <td className="actions-cell">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="action-btn me-1"
                            onClick={() => handleEditFuel(fuel)}
                            disabled={!allowedRoles.includes(userRole)}
                            title="Edit"
                          >
                            <FaEdit />
                          </Button>
                          {allowedRoles.includes(userRole) && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="action-btn"
                              onClick={() => confirmDelete(fuel)}
                              title="Delete"
                            >
                              <FaTrash />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>

        <Modal show={showModal} onHide={() => setShowModal(false)} size="xl">
          <Modal.Header closeButton>
            <Modal.Title>{currentFuel ? 'Edit Fuel Data' : 'Add Fuel Data'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && (
              <Alert variant="danger">{formError}</Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <div className="row">
                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Date of Flight*</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateOfFlight"
                    value={formData.dateOfFlight}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Time of Departure*</Form.Label>
                  <Form.Control
                    type="text"
                    name="timeOfDeparture"
                    value={formData.timeOfDeparture}
                    onChange={handleInputChange}
                    placeholder="HH:MM:SS"
                    required
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Flight Number*</Form.Label>
                  <Form.Control
                    type="text"
                    name="flightNumber"
                    value={formData.flightNumber}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Departure Airport*</Form.Label>
                  <Form.Control
                    type="text"
                    name="departureAirport"
                    value={formData.departureAirport}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Arrival Airport*</Form.Label>
                  <Form.Control
                    type="text"
                    name="arrivalAirport"
                    value={formData.arrivalAirport}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Alternate Arrival Airport</Form.Label>
                  <Form.Control
                    type="text"
                    name="alternateArrivalAirport"
                    value={formData.alternateArrivalAirport}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Taxi Fuel</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="taxiFuel"
                    value={formData.taxiFuel}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Trip Fuel</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="tripFuel"
                    value={formData.tripFuel}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Contingency Fuel</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="contingencyFuel"
                    value={formData.contingencyFuel}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Block Fuel</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="blockFuel"
                    value={formData.blockFuel}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Final Reserve</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="finalReserve"
                    value={formData.finalReserve}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Additional Fuel (tonnes)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="additionalFuel"
                    value={formData.additionalFuel}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Fuel for Other Safety Rules (tonnes)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="fuelForOtherSafetyRules"
                    value={formData.fuelForOtherSafetyRules}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Discretionary Fuel</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="discretionaryFuel"
                    value={formData.discretionaryFuel}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Extra Fuel</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="extraFuel"
                    value={formData.extraFuel}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Reason</Form.Label>
                  <Form.Control
                    type="text"
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Economic Tankering Category</Form.Label>
                  <Form.Control
                    type="text"
                    name="economicTankeringCategory"
                    value={formData.economicTankeringCategory}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Alternate Fuel</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="alternateFuel"
                    value={formData.alternateFuel}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>FOB (Fuel On Board)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="fob"
                    value={formData.fob}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Block On (tonnes)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="blockOn"
                    value={formData.blockOn}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Block Off (tonnes)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="blockOff"
                    value={formData.blockOff}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Uplift Volume (Litres)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="upliftVolume"
                    value={formData.upliftVolume}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Uplift Density</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="upliftDensity"
                    value={formData.upliftDensity}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Carbon Emission (kg)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="carbonEmission"
                    value={formData.carbonEmission}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>Pilot ID</Form.Label>
                  <Form.Control
                    type="text"
                    name="pilotId"
                    value={formData.pilotId}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>

              <div className="d-flex justify-content-end mt-3">
                <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {currentFuel ? 'Update Fuel Data' : 'Add Fuel Data'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Deletion</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to delete this fuel data?</p>
            {fuelToDelete && (
              <p>Flight: <strong>{fuelToDelete.flightNumber}</strong> - Date: <strong>{fuelToDelete.dateOfFlight ? new Date(fuelToDelete.dateOfFlight).toLocaleDateString() : 'N/A'}</strong></p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteFuel}>
              Delete
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default FuelList;