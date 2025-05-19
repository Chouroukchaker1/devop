import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Alert, Spinner, Card } from 'react-bootstrap';
import { FaEdit, FaTrash, FaPlus, FaSyncAlt, FaPlane } from 'react-icons/fa';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

// Custom CSS for FlightList (unchanged)
const customStyles = `
  .flight-management-container {
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
  
  .flight-table-card {
    border: none;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    margin-bottom: 2rem;
    overflow: hidden;
  }
  
  .flights-table {
    margin-bottom: 0;
  }
  
  .flights-table thead {
    background-color: #3498db;
    color: white;
  }
  
  .flights-table thead th {
    font-weight: 500;
    border-bottom: none;
    text-align: center;
    vertical-align: middle;
    padding: 0.75rem;
  }
  
  .flights-table tbody tr:hover {
    background-color: rgba(52, 152, 219, 0.05);
  }
  
  .flights-table td {
    vertical-align: middle;
    font-size: 0.9rem;
    text-align: center;
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
  
  .add-flight-btn {
    background-color: #2ecc71;
    border-color: #2ecc71;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .add-flight-btn:hover {
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
    right: 20px;
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
  
  .flight-id-cell {
    font-weight: 600;
  }
  
  .form-label {
    font-weight: 500;
    color: #2c3e50;
  }
`;

const FlightList = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentFlight, setCurrentFlight] = useState(null);
  const [formData, setFormData] = useState({
    dateOfOperationUTC: '',
    acRegistration: '',
    flightID: '',
    icaoCallSign: '',
    acType: '',
    flightType: '',
    departingAirportICAOCode: '',
    departureTimeUTC: '',
    destinationAirportICAOCode: '',
    arrivalTimeUTC: '',
    upliftVolumeLitres: '',
    upliftDensity: '',
    blockOnTonnes: '',
    blockOffTonnes: ''
  });
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [flightToDelete, setFlightToDelete] = useState(null);

  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  const axiosConfig = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  };

  useEffect(() => {
    fetchFlights();
  }, []);

  const fetchFlights = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/flightData', axiosConfig);
      if (response.data.success) {
        setFlights(response.data.data);
      } else {
        setError('Échec de récupération des données de vol');
      }
    } catch (err) {
      setError('Erreur serveur: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddFlight = () => {
    setCurrentFlight(null);
    setFormData({
      dateOfOperationUTC: new Date().toISOString().split('T')[0],
      acRegistration: '',
      flightID: '',
      icaoCallSign: '',
      acType: '',
      flightType: '',
      departingAirportICAOCode: '',
      departureTimeUTC: '',
      destinationAirportICAOCode: '',
      arrivalTimeUTC: '',
      upliftVolumeLitres: '',
      upliftDensity: '',
      blockOnTonnes: '',
      blockOffTonnes: ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleEditFlight = (flight) => {
    const flightDateOnly = new Date(flight.dateOfOperationUTC).toISOString().split('T')[0];
    setCurrentFlight(flight);
    setFormData({
      dateOfOperationUTC: flightDateOnly,
      acRegistration: flight.acRegistration,
      flightID: flight.flightID,
      icaoCallSign: flight.icaoCallSign,
      acType: flight.acType,
      flightType: flight.flightType,
      departingAirportICAOCode: flight.departingAirportICAOCode,
      departureTimeUTC: flight.departureTimeUTC,
      destinationAirportICAOCode: flight.destinationAirportICAOCode,
      arrivalTimeUTC: flight.arrivalTimeUTC,
      upliftVolumeLitres: flight.upliftVolumeLitres || '',
      upliftDensity: flight.upliftDensity || '',
      blockOnTonnes: flight.blockOnTonnes || '',
      blockOffTonnes: flight.blockOffTonnes || ''
    });
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Ensure all required fields are filled and format data correctly
    const numericFormData = {
      dateOfOperationUTC: formData.dateOfOperationUTC,
      acRegistration: formData.acRegistration,
      flightID: formData.flightID,
      icaoCallSign: formData.icaoCallSign,
      acType: formData.acType,
      flightType: formData.flightType,
      departingAirportICAOCode: formData.departingAirportICAOCode,
      departureTimeUTC: formData.departureTimeUTC,
      destinationAirportICAOCode: formData.destinationAirportICAOCode,
      arrivalTimeUTC: formData.arrivalTimeUTC,
      upliftVolumeLitres: formData.upliftVolumeLitres ? Number(formData.upliftVolumeLitres) : null,
      upliftDensity: formData.upliftDensity ? Number(formData.upliftDensity) : null,
      blockOnTonnes: formData.blockOnTonnes ? Number(formData.blockOnTonnes) : null,
      blockOffTonnes: formData.blockOffTonnes ? Number(formData.blockOffTonnes) : null
    };

    try {
      let response;
      if (currentFlight) {
        response = await axios.put(
          `http://localhost:3000/api/flightData/${currentFlight._id}`,
          [numericFormData], // Keep array for consistency with backend validation
          axiosConfig
        );
      } else {
        response = await axios.post(
          'http://localhost:3000/api/flightData',
          [numericFormData], // Keep array for consistency with backend validation
          axiosConfig
        );
      }

      if (response.data.success) {
        setShowModal(false);
        setSuccessMessage(currentFlight ? 'Vol mis à jour avec succès!' : 'Vol ajouté avec succès!');
        fetchFlights();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setFormError(response.data.message || 'Une erreur est survenue');
      }
    } catch (err) {
      // Provide detailed error message from backend if available
      const errorMessage = err.response?.data?.message || err.message;
      setFormError(`Erreur: ${errorMessage}`);
    }
  };

  const confirmDelete = (flight) => {
    setFlightToDelete(flight);
    setShowDeleteModal(true);
  };

  const handleDeleteFlight = async () => {
    if (!flightToDelete) return;

    try {
      const response = await axios.delete(
        `http://localhost:3000/api/flightData/${flightToDelete._id}`,
        axiosConfig
      );

      if (response.data.success) {
        setShowDeleteModal(false);
        setSuccessMessage('Vol supprimé avec succès!');
        fetchFlights();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(response.data.message || 'Échec de la suppression');
      }
    } catch (err) {
      setError('Erreur: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <>
      <style>{customStyles}</style>

      <div className="flight-management-container">
        <h1 className="page-title">
          <FaPlane className="page-title-icon" /> Gestion des Vols
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
              Fermer
            </Button>
          </Alert>
        )}

        <div className="actions-container">
          {(userRole === 'admin' || userRole === 'responsablevol') && (
            <Button
              variant="primary"
              className="add-flight-btn"
              onClick={handleAddFlight}
            >
              <FaPlus /> Ajouter un vol
            </Button>
          )}
          <Button
            variant="secondary"
            className="refresh-btn"
            onClick={fetchFlights}
          >
            <FaSyncAlt /> Rafraîchir
          </Button>
        </div>

        <Card className="flight-table-card">
          <Card.Body>
            {loading ? (
              <div className="text-center my-4">
                <Spinner animation="border" variant="primary" role="status">
                  <span className="visually-hidden">Chargement...</span>
                </Spinner>
                <p className="mt-2">Chargement des données...</p>
              </div>
            ) : flights.length === 0 ? (
              <div className="no-data-message">
                <p>Aucun vol trouvé. Cliquez sur "Ajouter un vol" pour commencer.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover className="flights-table">
                  <thead>
                    <tr>
                      <th>Date(utc)</th>
                      <th>AC registration</th>
                      <th>Flight ID</th>
                      <th>ICAO Call sign</th>
                      <th>AC Type</th>
                      <th>Flight type</th>
                      <th>Departing (ICAO)</th>
                      <th>Departure Time</th>
                      <th>Destination (ICAO)</th>
                      <th>Arrival Time</th>
                      <th>Uplift Volume (L)</th>
                      <th>Uplift density</th>
                      <th>Block On (t)</th>
                      <th>Block Off (t)</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flights.map((flight) => (
                      <tr key={flight._id}>
                        <td>{new Date(flight.dateOfOperationUTC).toLocaleDateString('en-US')}</td>
                        <td>{flight.acRegistration}</td>
                        <td className="flight-id-cell">{flight.flightID?.split('-')[0]}</td>
                        <td>{flight.icaoCallSign}</td>
                        <td>{flight.acType}</td>
                        <td>{flight.flightType}</td>
                        <td>{flight.departingAirportICAOCode}</td>
                        <td>{flight.departureTimeUTC}</td>
                        <td>{flight.destinationAirportICAOCode}</td>
                        <td>{flight.arrivalTimeUTC}</td>
                        <td>{flight.upliftVolumeLitres}</td>
                        <td>{flight.upliftDensity}</td>
                        <td>{flight.blockOnTonnes}</td>
                        <td>{flight.blockOffTonnes}</td>
                        <td className="actions-cell">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="action-btn me-1"
                            onClick={() => handleEditFlight(flight)}
                            disabled={!(userRole === 'admin' || userRole === 'responsablevol')}
                            title="Modifier"
                          >
                            <FaEdit />
                          </Button>
                          {userRole === 'admin' && (
                            <Button
                              variant="outline-danger"
                              size="sm"
                              className="action-btn"
                              onClick={() => confirmDelete(flight)}
                              title="Supprimer"
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

        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>{currentFlight ? 'Modifier un Vol' : 'Ajouter un Vol'}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {formError && (
              <Alert variant="danger">{formError}</Alert>
            )}
            <Form onSubmit={handleSubmit}>
              <div className="row">
                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>Date d'opération*</Form.Label>
                  <Form.Control
                    type="date"
                    name="dateOfOperationUTC"
                    value={formData.dateOfOperationUTC}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>Flight ID*</Form.Label>
                  <Form.Control
                    type="text"
                    name="flightID"
                    value={formData.flightID}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>acRegistration*</Form.Label>
                  <Form.Control
                    type="text"
                    name="acRegistration"
                    value={formData.acRegistration}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>icaoCallSign*</Form.Label>
                  <Form.Control
                    type="text"
                    name="icaoCallSign"
                    value={formData.icaoCallSign}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="col-md-4 mb-3">
                  <Form.Label>acType*</Form.Label>
                  <Form.Control
                    type="text"
                    name="acType"
                    value={formData.acType}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>flightType*</Form.Label>
                  <Form.Control
                    type="text"
                    name="flightType"
                    value={formData.flightType}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>departingAirportICAOCode*</Form.Label>
                  <Form.Control
                    type="text"
                    name="departingAirportICAOCode"
                    value={formData.departingAirportICAOCode}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>departureTimeUTC*</Form.Label>
                  <Form.Control
                    type="text"
                    name="departureTimeUTC"
                    value={formData.departureTimeUTC}
                    onChange={handleInputChange}
                    placeholder="HH:MM"
                    required
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>destinationAirportICAOCode*</Form.Label>
                  <Form.Control
                    type="text"
                    name="destinationAirportICAOCode"
                    value={formData.destinationAirportICAOCode}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>

                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>arrivalTimeUTC*</Form.Label>
                  <Form.Control
                    type="text"
                    name="arrivalTimeUTC"
                    value={formData.arrivalTimeUTC}
                    onChange={handleInputChange}
                    placeholder="HH:MM"
                    required
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>upliftVolume</Form.Label>
                  <Form.Control
                    type="number"
                    name="upliftVolumeLitres"
                    value={formData.upliftVolumeLitres}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>upliftDensity</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="upliftDensity"
                    value={formData.upliftDensity}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>

              <div className="row">
                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>block On</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="blockOnTonnes"
                    value={formData.blockOnTonnes}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="col-md-6 mb-3">
                  <Form.Label>Block Off</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.001"
                    name="blockOffTonnes"
                    value={formData.blockOffTonnes}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </div>

              <div className="d-flex justify-content-end mt-3">
                <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">
                  Annuler
                </Button>
                <Button variant="primary" type="submit">
                  {currentFlight ? 'Mettre à jour' : 'Ajouter'}
                </Button>
              </div>
            </Form>
          </Modal.Body>
        </Modal>

        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Confirmer la suppression</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {flightToDelete && (
              <p>
                Êtes-vous sûr de vouloir supprimer le vol <strong>{flightToDelete.flightID}</strong> du {" "}
                <strong>{new Date(flightToDelete.dateOfOperationUTC).toLocaleDateString()}</strong> ?
                <br />
                Cette action est irréversible.
              </p>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDeleteFlight}>
              Supprimer
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  );
};

export default FlightList;