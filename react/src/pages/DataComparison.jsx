import React, { useState, useEffect } from 'react';
import { Button, Modal, Table, Alert, Spinner } from 'react-bootstrap';
import { FaDownload } from 'react-icons/fa';
import axios from 'axios';
import * as XLSX from 'xlsx';
import './DataComparison.css';

const DataComparison = ({ onFuelDataImported, onFlightDataImported }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [flightDataFromDB, setFlightDataFromDB] = useState([]);
  const [fuelDataFromDB, setFuelDataFromDB] = useState([]);
  const [filteredFlightData, setFilteredFlightData] = useState([]);
  const [filteredFuelData, setFilteredFuelData] = useState([]);

  const token = localStorage.getItem('token');

  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  const FLIGHT_COLUMNS = [
    { key: 'Date of operation (UTC)', label: 'Date of operation (UTC)' },
    { key: 'AC registration', label: 'AC registration' },
    { key: 'Flight ID', label: 'Flight ID' },
    { key: 'ICAO Call sign', label: 'ICAO Call sign' },
    { key: 'AC Type', label: 'AC Type' },
    { key: 'Flight type', label: 'Flight type' },
    { key: 'Departing Airport ICAO Code', label: 'Departing Airport ICAO Code' },
    { key: 'Departure Time/ Block-off time (UTC)', label: 'Departure Time/ Block-off time (UTC)' },
    { key: 'Destination Airport ICAO Code', label: 'Destination Airport ICAO Code' },
    { key: 'Arrival Time/ Block-on Time(UTC)', label: 'Arrival Time/ Block-on Time(UTC)' },
    { key: 'Uplift Volume (Litres)', label: 'Uplift Volume (Litres)' },
    { key: 'Uplift density', label: 'Uplift density' },
    { key: 'Block On (tonnes)', label: 'Block On (tonnes)' },
    { key: 'Block Off (tonnes)', label: 'Block Off (tonnes)' },
  ];

  const FUEL_COLUMNS = [
    { key: 'Date of Flight', label: 'Date of Flight' },
    { key: 'Time of Departure', label: 'Time of Departure' },
    { key: 'Flight Number', label: 'Flight Number' },
    { key: 'DepartureAirport', label: 'DepartureAirport' },
    { key: 'ArrivalAirport', label: 'ArrivalAirport' },
    { key: 'TaxiFuel', label: 'TaxiFuel' },
    { key: 'TripFuel', label: 'TripFuel' },
    { key: 'ContingencyFuel', label: 'ContingencyFuel' },
    { key: 'BlockFuel', label: 'BlockFuel' },
    { key: 'FinalReserveFuel', label: 'FinalReserveFuel' },
    { key: 'AdditionalFuel', label: 'Additional Fuel (tonnes)' },
    { key: 'DiscretionaryFuel', label: 'Discretionary Fuel' },
    { key: 'ExtraFuel', label: 'ExtraFuel' },
    { key: 'Reason', label: 'Reason' },
    { key: 'TankeringCategory', label: 'Economic tankering category in the flight plan' },
    { key: 'AlternateFuel', label: 'AlternateFuel' },
    { key: 'AlternateArrivalAirport', label: 'Alternate Arrival Airport' },
    { key: 'FOB', label: 'FOB' },
  ];

  useEffect(() => {
    fetchFlightDataFromDB();
    fetchFuelDataFromDB();
  }, []);

  const fetchFlightDataFromDB = async () => {
    try {
      const response = await axios.get('http://localhost:8082/api/flightdata', axiosConfig);
      if (response.data.success) {
        setFlightDataFromDB(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching flight data:', err);
      setError('Error fetching flight data: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const fetchFuelDataFromDB = async () => {
    try {
      const response = await axios.get('http://localhost:8082/api/fueldata', axiosConfig);
      if (response.data.success) {
        setFuelDataFromDB(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching fuel data:', err);
      setError('Error fetching fuel data: ' + err.message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const transformData = (rawData, columns) => {
    if (!Array.isArray(rawData)) {
      console.error('Invalid data format:', rawData);
      return [];
    }
    return rawData.map((item) => {
      let transformedItem = {};
      columns.forEach((column) => {
        let value = item[column.label] || item[column.key];
        if (value === null || value === undefined || value === '') {
          transformedItem[column.key] = '';
        } else if (typeof value === 'number') {
          transformedItem[column.key] = Number(value.toFixed(3));
        } else {
          transformedItem[column.key] = String(value).trim() === 'N/A' ? '' : String(value).trim();
        }
      });
      return transformedItem;
    });
  };

  const loadData = async (dataType) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const endpoint = `excel/${dataType}`;
      const response = await axios.get(
        `http://localhost:8082/api/data/${endpoint}`,
        { ...axiosConfig, responseType: 'arraybuffer' }
      );

      const workbook = XLSX.read(response.data, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const fileData = XLSX.utils.sheet_to_json(worksheet);

      processData(dataType, fileData);

      setSuccessMessage(`${dataType} data loaded successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(`Error loading ${dataType} data:`, err);
      setError(`Error loading ${dataType} data: ${err.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const processData = (dataType, fileData) => {
    const transformedData = transformData(fileData, dataType === 'flight' ? FLIGHT_COLUMNS : FUEL_COLUMNS);
    const dbData = dataType === 'flight' ? flightDataFromDB : fuelDataFromDB;
    const key = dataType === 'flight' ? 'Flight ID' : 'Flight Number';
    const dateKey = dataType === 'flight' ? 'Date of operation (UTC)' : 'Date of Flight';

    const newRecords = findNewRecords(transformedData, dbData, key, dateKey);

    if (dataType === 'flight') {
      setFilteredFlightData(newRecords);
      setShowFlightModal(true);
    } else {
      setFilteredFuelData(newRecords);
      setShowFuelModal(true);
    }
  };

  const findNewRecords = (fileData, dbData, key, dateKey) => {
    if (!dbData.length) return fileData;

    const existingKeys = new Set(
      dbData.map((item) => {
        const itemKey = item[key]?.toString().trim().toLowerCase();
        const itemDate = item[dateKey]?.toString().trim();
        return itemKey && itemDate ? `${itemKey}|${itemDate}` : null;
      }).filter(Boolean)
    );

    return fileData.filter((item) => {
      const itemKey = item[key]?.toString().trim().toLowerCase();
      const itemDate = item[dateKey]?.toString().trim();
      const combinedKey = itemKey && itemDate ? `${itemKey}|${itemDate}` : null;
      return combinedKey && !existingKeys.has(combinedKey);
    });
  };

  const handleDownload = async (dataType) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

ავ

    try {
      const endpoint = `excel/${dataType}`;
      const filename = `${dataType}_data.xlsx`;

      const response = await axios.get(
        `http://localhost:8082/api/data/${endpoint}`,
        { ...axiosConfig, responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMessage(`${filename} downloaded successfully`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(`Download error:`, err);
      setError(`Download error: ${err.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (dataType, data) => {
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const endpoint = dataType === 'flight' ? 'flightdata/import' : 'fueldata/import';
      const response = await axios.post(
        `http://localhost:8082/api/${endpoint}`,
        data,
        axiosConfig
      );

      if (response.data.success) {
        setSuccessMessage(`Imported ${data.length} ${dataType} records successfully`);
        setTimeout(() => setSuccessMessage(''), 3000);

        if (dataType === 'flight') {
          setShowFlightModal(false);
          setFilteredFlightData([]);
          fetchFlightDataFromDB();
          if (onFlightDataImported) {
            onFlightDataImported(data);
          }
        } else {
          setShowFuelModal(false);
          setFilteredFuelData([]);
          fetchFuelDataFromDB();
          if (onFuelDataImported) {
            onFuelDataImported(data);
          }
        }
      } else {
        throw new Error(response.data.message || `Failed to import ${dataType} data`);
      }
    } catch (err) {
      console.error(`Import failed:`, err);
      setError(`Import failed: ${err.response?.data?.message || err.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-comparison-container">
      <h2>Data Comparison Tool</h2>
      <p>Compare and import data from Excel files</p>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          <i className="fas fa-exclamation-circle"></i> {error}
        </Alert>
      )}
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
          <i className="fas fa-check-circle"></i> {successMessage}
        </Alert>
      )}

      <div className="action-buttons">
        <Button
          variant="primary"
          onClick={() => loadData('flight')}
          disabled={loading}
        >
          {loading ? <Spinner animation="border" size="sm" /> : 'Compare Flight Data'}
        </Button>

        <Button
          variant="primary"
          onClick={() => loadData('fuel')}
          disabled={loading}
        >
          {loading ? <Spinner animation="border" size="sm" /> : 'Compare Fuel Data'}
        </Button>

        <Button
          variant="secondary"
          onClick={() => handleDownload('flight')}
          disabled={loading}
        >
          <FaDownload /> Flight Template
        </Button>

        <Button
          variant="secondary"
          onClick={() => handleDownload('fuel')}
          disabled={loading}
        >
          <FaDownload /> Fuel Template
        </Button>
      </div>

      <Modal
        show={showFlightModal}
        onHide={() => setShowFlightModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>New Flight Records</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {filteredFlightData.length > 0 ? (
            <div className="table-responsive">
              <Table striped bordered hover className="fuel-data-table">
                <thead className="thead-dark">
                  <tr>
                    {FLIGHT_COLUMNS.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFlightData.map((item, index) => (
                    <tr key={index}>
                      {FLIGHT_COLUMNS.map((col) => (
                        <td key={`${col.key}-${index}`}>
                          {item[col.key] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info">No new flight records found.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="danger"
            onClick={() => setShowFlightModal(false)}
          >
            <i className="fas fa-times-circle"></i> Close
          </Button>
          {filteredFlightData.length > 0 && (
            <Button
              variant="success"
              onClick={() => handleImport('flight', filteredFlightData)}
            >
              <i className="fas fa-check-circle"></i> Import {filteredFlightData.length} Records
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      <Modal
        show={showFuelModal}
        onHide={() => setShowFuelModal(false)}
        size="xl"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>New Fuel Records</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {filteredFuelData.length > 0 ? (
            <div className="table-responsive">
              <Table striped bordered hover className="fuel-data-table">
                <thead className="thead-dark">
                  <tr>
                    {FUEL_COLUMNS.map((col) => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredFuelData.map((item, index) => (
                    <tr key={index}>
                      {FUEL_COLUMNS.map((col) => (
                        <td key={`${col.key}-${index}`}>
                          {item[col.key] || ''}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Alert variant="info">No new fuel records found.</Alert>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="danger"
            onClick={() => setShowFuelModal(false)}
          >
            <i className="fas fa-times-circle"></i> Close
          </Button>
          {filteredFuelData.length > 0 && (
            <Button
              variant="success"
              onClick={() => handleImport('fuel', filteredFuelData)}
            >
              <i className="fas fa-check-circle"></i> Import {filteredFuelData.length} Records
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DataComparison;