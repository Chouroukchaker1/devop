import React, { useState } from 'react';
import { Form, Button, Alert, Spinner, Table } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx'; // Added for Excel file parsing
import Papa from 'papaparse'; // Added for CSV file parsing

const FlightDataTransfer = () => {
  const [flightData, setFlightData] = useState([
    {
      dateOfOperationUTC: '',
      acRegistration: '',
      flightID: '',
      icaoCallSign: '',
      acType: '',
      company: '',
      flightType: '',
      departingAirportICAOCode: '',
      departureTimeUTC: '',
      destinationAirportICAOCode: '',
      arrivalTimeUTC: '',
      upliftVolumeLitres: null,
      upliftDensity: null,
      blockOnTonnes: null,
      blockOffTonnes: null
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ show: false, variant: '', message: '' });
  const [transferredData, setTransferredData] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Function to handle file upload and parse data
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const fileExtension = file.name.split('.').pop().toLowerCase();

    if (fileExtension === 'csv') {
      Papa.parse(file, {
        complete: (result) => {
          try {
            const parsedData = result.data
              .filter(row => Object.values(row).some(val => val)) // Remove empty rows
              .map(row => ({
                dateOfOperationUTC: row['Date of operation (UTC)'] || row.dateOfOperationUTC || '',
                acRegistration: row['AC registration'] || row.acRegistration || '',
                flightID: row['Flight ID'] || row.flightID || '',
                icaoCallSign: row['ICAO Call sign'] || row.icaoCallSign || '',
                acType: row['AC Type'] || row.acType || '',
                company: row['Cie'] || row.company || '',
                flightType: row['Flight type'] || row.flightType || '',
                departingAirportICAOCode: row['Departing Airport ICAO Code'] || row.departingAirportICAOCode || '',
                departureTimeUTC: row['Departure Time / Block-off time (UTC)'] || row.departureTimeUTC || '',
                destinationAirportICAOCode: row['Destination Airport ICAO Code'] || row.destinationAirportICAOCode || '',
                arrivalTimeUTC: row['Arrival Time / Block-on Time (UTC)'] || row.arrivalTimeUTC || '',
                upliftVolumeLitres: Number(row['Uplift Volume (Litres)'] || row.upliftVolumeLitres) || null,
                upliftDensity: Number(row['Uplift density'] || row.upliftDensity) || null,
                blockOnTonnes: Number(row['Block On (tonnes)'] || row.blockOnTonnes) || null,
                blockOffTonnes: Number(row['Block Off (tonnes)'] || row.blockOffTonnes) || null
              }));
            setFlightData(parsedData);
            setAlert({
              show: true,
              variant: 'success',
              message: `Données chargées avec succès (${parsedData.length} vols)`
            });
          } catch (error) {
            console.error('Error parsing CSV:', error);
            setAlert({
              show: true,
              variant: 'danger',
              message: `Erreur lors de l'analyse du fichier CSV: ${error.message}`
            });
          }
        },
        header: true,
        skipEmptyLines: true,
        error: (error) => {
          console.error('CSV parsing error:', error);
          setAlert({
            show: true,
            variant: 'danger',
            message: `Erreur lors de l'analyse du fichier CSV: ${error.message}`
          });
        }
      });
    } else if (['xlsx', 'xls'].includes(fileExtension)) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const parsedData = XLSX.utils.sheet_to_json(worksheet)
            .filter(row => Object.values(row).some(val => val)) // Remove empty rows
            .map(row => ({
              dateOfOperationUTC: row['Date of operation (UTC)'] || row.dateOfOperationUTC || '',
              acRegistration: row['AC registration'] || row.acRegistration || '',
              flightID: row['Flight ID'] || row.flightID || '',
              icaoCallSign: row['ICAO Call sign'] || row.icaoCallSign || '',
              acType: row['AC Type'] || row.acType || '',
              company: row['Cie'] || row.company || '',
              flightType: row['Flight type'] || row.flightType || '',
              departingAirportICAOCode: row['Departing Airport ICAO Code'] || row.departingAirportICAOCode || '',
              departureTimeUTC: row['Departure Time / Block-off time (UTC)'] || row.departureTimeUTC || '',
              destinationAirportICAOCode: row['Destination Airport ICAO Code'] || row.destinationAirportICAOCode || '',
              arrivalTimeUTC: row['Arrival Time / Block-on Time (UTC)'] || row.arrivalTimeUTC || '',
              upliftVolumeLitres: Number(row['Uplift Volume (Litres)'] || row.upliftVolumeLitres) || null,
              upliftDensity: Number(row['Uplift density'] || row.upliftDensity) || null,
              blockOnTonnes: Number(row['Block On (tonnes)'] || row.blockOnTonnes) || null,
              blockOffTonnes: Number(row['Block Off (tonnes)'] || row.blockOffTonnes) || null
            }));
          setFlightData(parsedData);
          setAlert({
            show: true,
            variant: 'success',
            message: `Données chargées avec succès (${parsedData.length} vols)`
          });
        } catch (error) {
          console.error('Error parsing Excel:', error);
          setAlert({
            show: true,
            variant: 'danger',
            message: `Erreur lors de l'analyse du fichier Excel: ${error.message}`
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setAlert({
        show: true,
        variant: 'danger',
        message: 'Format de fichier non supporté. Veuillez utiliser CSV, XLSX ou XLS.'
      });
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedData = [...flightData];
    if (['upliftVolumeLitres', 'upliftDensity', 'blockOnTonnes', 'blockOffTonnes'].includes(field)) {
      updatedData[index][field] = value === '' ? null : parseFloat(value);
    } else {
      updatedData[index][field] = value;
    }
    setFlightData(updatedData);

    // Clear validation error for this field
    setValidationErrors(prev => ({
      ...prev,
      [`${index}.${field}`]: ''
    }));
  };

  const addFlightRow = () => {
    setFlightData([...flightData, {
      dateOfOperationUTC: '',
      acRegistration: '',
      flightID: '',
      icaoCallSign: '',
      acType: '',
      company: '',
      flightType: '',
      departingAirportICAOCode: '',
      departureTimeUTC: '',
      destinationAirportICAOCode: '',
      arrivalTimeUTC: '',
      upliftVolumeLitres: null,
      upliftDensity: null,
      blockOnTonnes: null,
      blockOffTonnes: null
    }]);
  };

  const removeFlightRow = (index) => {
    const updatedData = [...flightData];
    updatedData.splice(index, 1);
    setFlightData(updatedData);

    // Clear validation errors for removed row
    setValidationErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith(`${index}.`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const validateForm = () => {
    const errors = {};
    flightData.forEach((flight, index) => {
      if (!flight.dateOfOperationUTC) errors[`${index}.dateOfOperationUTC`] = 'Date d\'opération requise';
      if (!flight.acRegistration) errors[`${index}.acRegistration`] = 'Immatriculation requise';
      if (!flight.flightID) errors[`${index}.flightID`] = 'ID de vol requis';
      if (!flight.icaoCallSign) errors[`${index}.icaoCallSign`] = 'Call Sign ICAO requis';
      if (!flight.acType) errors[`${index}.acType`] = 'Type d\'avion requis';
      if (!flight.flightType) errors[`${index}.flightType`] = 'Type de vol requis';
      if (!flight.departingAirportICAOCode) errors[`${index}.departingAirportICAOCode`] = 'Aéroport de départ requis';
      if (!flight.departureTimeUTC) errors[`${index}.departureTimeUTC`] = 'Heure de départ requise';
      if (!flight.destinationAirportICAOCode) errors[`${index}.destinationAirportICAOCode`] = 'Aéroport d\'arrivée requis';
      if (!flight.arrivalTimeUTC) errors[`${index}.arrivalTimeUTC`] = 'Heure d\'arrivée requise';
      if (flight.upliftVolumeLitres && isNaN(flight.upliftVolumeLitres)) errors[`${index}.upliftVolumeLitres`] = 'Volume de carburant doit être numérique';
      if (flight.upliftDensity && isNaN(flight.upliftDensity)) errors[`${index}.upliftDensity`] = 'Densité doit être numérique';
      if (flight.blockOnTonnes && isNaN(flight.blockOnTonnes)) errors[`${index}.blockOnTonnes`] = 'Block On doit être numérique';
      if (flight.blockOffTonnes && isNaN(flight.blockOffTonnes)) errors[`${index}.blockOffTonnes`] = 'Block Off doit être numérique';
    });
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAlert({ show: false, variant: '', message: '' });
    setValidationErrors({});

    if (!validateForm()) {
      setAlert({
        show: true,
        variant: 'danger',
        message: 'Veuillez corriger les erreurs dans le formulaire'
      });
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setAlert({
        show: true,
        variant: 'danger',
        message: 'Vous devez être connecté pour transférer des données'
      });
      setLoading(false);
      return;
    }

    try {
      // Format dates and ensure proper ISO format
      const formattedData = flightData.map(flight => {
        const date = flight.dateOfOperationUTC
          ? new Date(flight.dateOfOperationUTC).toISOString()
          : '';
        return {
          ...flight,
          dateOfOperationUTC: date
        };
      });

      const response = await axios.post(
        'http://localhost:8082/api/transfer/flight',
        formattedData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      setTransferredData(response.data);
      setAlert({
        show: true,
        variant: 'success',
        message: `${response.data.count} vols transférés avec succès`
      });

      // Reset form after successful submission
      setFlightData([{
        dateOfOperationUTC: '',
        acRegistration: '',
        flightID: '',
        icaoCallSign: '',
        acType: '',
        company: '',
        flightType: '',
        departingAirportICAOCode: '',
        departureTimeUTC: '',
        destinationAirportICAOCode: '',
        arrivalTimeUTC: '',
        upliftVolumeLitres: null,
        upliftDensity: null,
        blockOnTonnes: null,
        blockOffTonnes: null
      }]);
    } catch (error) {
      console.error('Error transferring flight data:', error);
      let errorMessage = error.response?.data?.message || error.message;
      if (error.response?.status === 400 && error.response.data.errors) {
        const errors = error.response.data.errors.reduce((acc, err) => {
          acc[err.path] = err.msg;
          return acc;
        }, {});
        setValidationErrors(errors);
        errorMessage = 'Veuillez corriger les erreurs dans les données soumises';
      } else if (error.response?.status === 400 && error.response.data.message.includes('Duplicate flight IDs')) {
        errorMessage = `IDs de vol en doublon: ${error.response.data.message.split(': ')[1]}`;
      }
      setAlert({
        show: true,
        variant: 'danger',
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <h4 className="mb-3">Transfert des Données de Vol</h4>

      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ ...alert, show: false })} dismissible>
          {alert.message}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Importer depuis un fichier</Form.Label>
          <Form.Control
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
          />
          <Form.Text className="text-muted">
            Importez un fichier CSV ou Excel contenant les données de vol
          </Form.Text>
        </Form.Group>

        <h5 className="mt-4 mb-3">Saisie manuelle des données</h5>

        {flightData.map((flight, index) => (
          <div key={index} className="mb-4 p-3 border rounded">
            <div className="d-flex justify-content-between mb-2">
              <h6>Vol #{index + 1}</h6>
              {flightData.length > 1 && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => removeFlightRow(index)}
                >
                  Supprimer
                </Button>
              )}
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Date d'opération (UTC)</Form.Label>
                  <Form.Control
                    type="date"
                    value={flight.dateOfOperationUTC ? flight.dateOfOperationUTC.split('T')[0] : ''}
                    onChange={(e) => handleInputChange(index, 'dateOfOperationUTC', e.target.value)}
                    required
                    isInvalid={!!validationErrors[`${index}.dateOfOperationUTC`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.dateOfOperationUTC`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Immatriculation (AC Registration)</Form.Label>
                  <Form.Control
                    type="text"
                    value={flight.acRegistration}
                    onChange={(e) => handleInputChange(index, 'acRegistration', e.target.value)}
                    required
                    isInvalid={!!validationErrors[`${index}.acRegistration`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.acRegistration`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>ID de vol</Form.Label>
                  <Form.Control
                    type="text"
                    value={flight.flightID}
                    onChange={(e) => handleInputChange(index, 'flightID', e.target.value)}
                    required
                    isInvalid={!!validationErrors[`${index}.flightID`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.flightID`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>ICAO Call Sign</Form.Label>
                  <Form.Control
                    type="text"
                    value={flight.icaoCallSign}
                    onChange={(e) => handleInputChange(index, 'icaoCallSign', e.target.value)}
                    required
                    isInvalid={!!validationErrors[`${index}.icaoCallSign`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.icaoCallSign`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-4">
                <Form.Group className="mb-3">
                  <Form.Label>Type d'avion</Form.Label>
                  <Form.Control
                    type="text"
                    value={flight.acType}
                    onChange={(e) => handleInputChange(index, 'acType', e.target.value)}
                    required
                    isInvalid={!!validationErrors[`${index}.acType`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.acType`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Compagnie</Form.Label>
                  <Form.Control
                    type="text"
                    value={flight.company}
                    onChange={(e) => handleInputChange(index, 'company', e.target.value)}
                    isInvalid={!!validationErrors[`${index}.company`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.company`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Type de vol</Form.Label>
                  <Form.Control
                    type="text"
                    value={flight.flightType}
                    onChange={(e) => handleInputChange(index, 'flightType', e.target.value)}
                    required
                    isInvalid={!!validationErrors[`${index}.flightType`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.flightType`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Aéroport de départ (Code ICAO)</Form.Label>
                  <Form.Control
                    type="text"
                    value={flight.departingAirportICAOCode}
                    onChange={(e) => handleInputChange(index, 'departingAirportICAOCode', e.target.value)}
                    required
                    isInvalid={!!validationErrors[`${index}.departingAirportICAOCode`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.departingAirportICAOCode`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Heure de départ (UTC)</Form.Label>
                  <Form.Control
                    type="time"
                    value={flight.departureTimeUTC}
                    onChange={(e) => handleInputChange(index, 'departureTimeUTC', e.target.value)}
                    required
                    isInvalid={!!validationErrors[`${index}.departureTimeUTC`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.departureTimeUTC`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Aéroport d'arrivée (Code ICAO)</Form.Label>
                  <Form.Control
                    type="text"
                    value={flight.destinationAirportICAOCode}
                    onChange={(e) => handleInputChange(index, 'destinationAirportICAOCode', e.target.value)}
                    required
                    isInvalid={!!validationErrors[`${index}.destinationAirportICAOCode`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.destinationAirportICAOCode`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Heure d'arrivée (UTC)</Form.Label>
                  <Form.Control
                    type="time"
                    value={flight.arrivalTimeUTC}
                    onChange={(e) => handleInputChange(index, 'arrivalTimeUTC', e.target.value)}
                    required
                    isInvalid={!!validationErrors[`${index}.arrivalTimeUTC`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.arrivalTimeUTC`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>

            <div className="row">
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>Volume de carburant (Litres)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={flight.upliftVolumeLitres ?? ''}
                    onChange={(e) => handleInputChange(index, 'upliftVolumeLitres', e.target.value)}
                    isInvalid={!!validationErrors[`${index}.upliftVolumeLitres`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.upliftVolumeLitres`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>Densité</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={flight.upliftDensity ?? ''}
                    onChange={(e) => handleInputChange(index, 'upliftDensity', e.target.value)}
                    isInvalid={!!validationErrors[`${index}.upliftDensity`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.upliftDensity`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>Block On (tonnes)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={flight.blockOnTonnes ?? ''}
                    onChange={(e) => handleInputChange(index, 'blockOnTonnes', e.target.value)}
                    isInvalid={!!validationErrors[`${index}.blockOnTonnes`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.blockOnTonnes`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
              <div className="col-md-3">
                <Form.Group className="mb-3">
                  <Form.Label>Block Off (tonnes)</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={flight.blockOffTonnes ?? ''}
                    onChange={(e) => handleInputChange(index, 'blockOffTonnes', e.target.value)}
                    isInvalid={!!validationErrors[`${index}.blockOffTonnes`]}
                  />
                  <Form.Control.Feedback type="invalid">
                    {validationErrors[`${index}.blockOffTonnes`]}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>
          </div>
        ))}

        <div className="d-flex mb-4">
          <Button
            variant="outline-primary"
            onClick={addFlightRow}
            className="me-2"
          >
            + Ajouter un vol
          </Button>
        </div>

        <Button
          variant="primary"
          type="submit"
          disabled={loading}
          className="mb-3"
        >
          {loading ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              Transfert en cours...
            </>
          ) : 'Transférer les données'}
        </Button>
      </Form>

      {transferredData && (
        <div className="mt-4">
          <h5>Résultats du transfert</h5>
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>ID MongoDB</th>
                <th>ID de vol</th>
                <th>Départ</th>
                <th>Arrivée</th>
                <th>Date</th>
                <th>Type d'avion</th>
                <th>Volume carburant (L)</th>
              </tr>
            </thead>
            <tbody>
              {transferredData.data.map((flight, index) => (
                <tr key={index}>
                  <td>{flight._id}</td>
                  <td>{flight.flightID}</td>
                  <td>{flight.departingAirportICAOCode}</td>
                  <td>{flight.destinationAirportICAOCode}</td>
                  <td>{new Date(flight.dateOfOperationUTC).toLocaleDateString()}</td>
                  <td>{flight.acType}</td>
                  <td>{flight.upliftVolumeLitres ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default FlightDataTransfer;