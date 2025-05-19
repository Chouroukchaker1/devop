import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import './ExtractionDataa.css';
import { jwtDecode } from "jwt-decode";


import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

const Modal = ({
  title = '',
  content = '',
  onClose,
  onAccept,
  onReject,
  showTable = false,
  processedData = [],
  COLUMNS = [],
  missingField = null,
  missingValue = null,
  onCompleteData,
  onDownload,
  showAcceptButton = true,
  newRecords = [],
  dataType = '',
  isAuthorized = false,
}) => {
  const [editModal, setEditModal] = useState(null);

  const handleEditClick = (record) => {
    setEditModal({
      record,
      updatedData: { ...record },
    });
  };

  const handleInputChange = (e, key) => {
    setEditModal((prev) => ({
      ...prev,
      updatedData: {
        ...prev.updatedData,
        [key]: e.target.value,
      },
    }));
  };

  const handleSaveChanges = () => {
    if (editModal) {
      const updatedProcessedData = processedData.map((item) =>
        item === editModal.record ? { ...item, ...editModal.updatedData } : item
      );
      onCompleteData(editModal.record, editModal.updatedData, updatedProcessedData);
      setEditModal(null);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-btn" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
        <h2>{title || 'Default Title'}</h2>
        {!showTable || editModal ? (
          editModal ? (
            <form>
              <div className="scrollable-form" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {COLUMNS.map((column) => (
                  <div key={column.key} className="mb-3">
                    <label className="form-label">{column.label}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editModal.updatedData[column.key] || ''}
                      onChange={(e) => handleInputChange(e, column.key)}
                    />
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setEditModal(null)}
                >
                  <i className="fas fa-times-circle"></i> Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={handleSaveChanges}
                >
                  <i className="fas fa-save"></i> Save
                </button>
              </div>
            </form>
          ) : (
            <p>{content || 'No content available'}</p>
          )
        ) : (
          <div className="modal-table-container">
            {processedData.length > 0 ? (
              <table className="table table-striped fuel-data-table">
                <thead className="thead-dark">
                  <tr>
                    {COLUMNS.map((column) => (
                      <th key={column.key}>{column.label}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {processedData.map((flight, index) => {
                    const identifier = dataType === 'flight' ? flight['Flight ID'] : flight['Flight Number'];
                    const isNew = newRecords.includes(identifier);
                    return (
                      <tr key={index}>
                        {COLUMNS.map((column) => (
                          <td
                            key={`${column.key}-${index}`}
                            style={{
                              backgroundColor:
                                missingField === column.key &&
                                flight[column.key] === missingValue
                                  ? '#ffcccc'
                                  : 'transparent',
                            }}
                          >
                            {(flight[column.key] === 'N/A' ? '' : flight[column.key]) || ''}
                          </td>
                        ))}
                        <td className="actions-cell">
  {isAuthorized && (
    <button
      onClick={() => handleEditClick(flight)}
      className="btn btn-sm btn-primary"
    >
      <i className="fas fa-edit"></i> Edit
    </button>
  )}
  {isNew && <span className="new-label">Nouveau</span>}
</td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <p>No data available to display.</p>
            )}
          </div>
        )}
        {!editModal && (
           <div className="modal-footer">
  {showTable && onDownload && (
    <button onClick={onDownload} className="btn btn-info me-2">
      <i className="fas fa-download"></i> Download as Excel
    </button>
  )}
  {isAuthorized && (
    <>
      <button onClick={onReject || onClose} className="btn btn-danger">
        <i className="fas fa-times-circle"></i> Refuser
      </button>
      {showAcceptButton && onAccept && (
        <button onClick={onAccept} className="btn btn-success">
          <i className="fas fa-check-circle"></i> Valider
        </button>
      )}
    </>
  )}
</div>

        )}
      </div>
    </div>
  );
};

const FuelDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    missingDetail,
    notificationId,
    notificationType,
    dataType,
    fieldName,
    missingValue,
  } = location.state || {};
  const userRole = localStorage.getItem('userRole');
  const isAuthorized = ['admin', 'fueldatamaster', 'fueluser'].includes(userRole);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeModal, setActiveModal] = useState(null);
  const [fuelData, setFuelData] = useState([]);
  const [flightData, setFlightData] = useState([]);
  const [mergedData, setMergedData] = useState([]);
  const [fuelListData, setFuelListData] = useState([]);
  const [flightListData, setFlightListData] = useState([]);
  const [isDataValidated, setIsDataValidated] = useState(false);
  const [newRecords, setNewRecords] = useState({ fuel: [], flight: [], merged: [] });

  const token = localStorage.getItem('token');
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    responseType: 'json',
  };

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
    { key: 'TankeringCategory belum ada di sini', label: 'Economic tankering category in the flight plan' },
    { key: 'AlternateFuel', label: 'AlternateFuel' },
    { key: 'AlternateArrivalAirport', label: 'Alternate Arrival Airport' },
    { key: 'FOB', label: 'FOB' },
    { key: 'carbonEmission', label: 'Carbon Emission (kg)' },
  ];

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

  const MERGED_COLUMNS = [
    { key: 'Date of Flight', label: 'Date of Flight' },
    { key: 'AC registration', label: 'AC registration' },
    { key: 'Flight Number', label: 'Flight Number' },
    { key: 'ICAO Call sign', label: 'ICAO Call sign' },
    { key: 'AC Type', label: 'AC Type' },
    { key: 'Flight type', label: 'Flight type' },
    { key: 'DepartureAirport', label: 'DepartureAirport' },
    { key: 'ArrivalAirport', label: 'ArrivalAirport' },
    { key: 'Time of Departure', label: 'Time of Departure' },
    { key: 'Arrival Time/ Block-on Time(UTC)', label: 'Arrival Time/ Block-on Time(UTC)' },
    { key: 'TaxiFuel', label: 'TaxiFuel' },
    { key: 'TripFuel', label: 'TripFuel' },
    { key: 'Uplift Volume (Litres)', label: 'Uplift Volume (Litres)' },
    { key: 'Uplift density', label: 'Uplift density' },
    { key: 'ContingencyFuel', label: 'ContingencyFuel' },
    { key: 'AlternateFuel', label: 'AlternateFuel' },
    { key: 'FinalReserveFuel', label: 'FinalReserveFuel' },
    { key: 'DiscretionaryFuel', label: 'Discretionary Fuel' },
    { key: 'ExtraFuel', label: 'ExtraFuel' },
    { key: 'AdditionalFuel', label: 'Additional Fuel (tonnes)' },
    { key: 'Reason', label: 'Reason' },
    { key: 'TankeringCategory', label: 'Economic tankering category in the flight plan' },
    { key: 'Block Off (tonnes)', label: 'Block Off (tonnes)' },
    { key: 'Block On (tonnes)', label: 'Block On (tonnes)' },
    { key: 'BlockFuel', label: 'BlockFuel' },
    { key: 'AlternateArrivalAirport', label: 'Alternate Arrival Airport' },
    { key: 'FOB', label: 'FOB' },
    { key: 'CompleteData', label: 'CompleteData' },
    { key: 'CarbonEmission', label: 'Carbon Emission (kg)' },
  ];

  const transformData = (rawData, columns) => {
    if (!Array.isArray(rawData)) {
      console.error('Invalid data format:', rawData);
      return [];
    }
    
    return rawData.map((item) => {
      let transformedItem = {};
      columns.forEach((column) => {
        let value = item[column.label] || item[column.key];
      
        // 🎯 Normalisation du champ carbone
        if (column.key === 'CarbonEmission' || column.key === 'carbonEmission') {
          value = item['Carbon Emission (kg)'] || item['CarbonEmission'] || item['carbonEmission'] || 0;
        }
      
        if (value === null || value === undefined || value === '') {
          transformedItem[column.key] = '';
        } else if (
          column.key === 'Departure Time/ Block-off time (UTC)' ||
          column.key === 'Arrival Time/ Block-on Time(UTC)'
        ) {
          if (typeof value === 'number') {
            // 🧮 Conversion Excel number → heure (ex: 43925.117 → "02:48:00")
            const excelDate = new Date(Math.round((value - 25569) * 86400 * 1000));
            const hours = excelDate.getUTCHours().toString().padStart(2, '0');
            const minutes = excelDate.getUTCMinutes().toString().padStart(2, '0');
            const seconds = excelDate.getUTCSeconds().toString().padStart(2, '0');
            transformedItem[column.key] = `${hours}:${minutes}:${seconds}`;
          } else if (typeof value === 'string' && value.includes(' ')) {
            // 🕑 Si c'est déjà une chaîne "04/04/2020 02:48:00"
            transformedItem[column.key] = value.split(' ')[1];
          } else {
            transformedItem[column.key] = value;
          }
        } else if (typeof value === 'number') {
          transformedItem[column.key] = Number(value.toFixed(3));
        } else {
          const stringValue = String(value).trim();
          transformedItem[column.key] = stringValue === 'N/A' ? '' : stringValue;
        }
      });
      
      // ✅ S'assurer que carbonEmission est bien défini
      if (!transformedItem.hasOwnProperty('carbonEmission') && transformedItem.hasOwnProperty('CarbonEmission')) {
        transformedItem.carbonEmission = transformedItem.CarbonEmission;
      }
      
      
      
      return transformedItem;
    });
  };

  const handleDownloadExcel = async (dataType) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `http://localhost:3000/api/data/excel/${dataType}`,
        {
          ...axiosConfig,
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${dataType}_data.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage(`Successfully downloaded ${dataType} data as Excel`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error(`Error downloading ${dataType} data:`, err);
      setError(`Error downloading ${dataType} data: ${err.message}`);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckNewData = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const response = await axios.get('http://localhost:3000/api/scheduler/check-new-data', axiosConfig);

      if (response.data.success) {
        const report = response.data.data;
        const fuelNewRecords = report.fuel_data?.newRecords || 0;
        const flightNewRecords = report.flight_data?.newRecords || 0;
        const fuelNewData = report.fuel_data?.newData || [];
        const flightNewData = report.flight_data?.newData || [];
        const totalNewRecords = fuelNewRecords + flightNewRecords;

        if (totalNewRecords > 0) {
          setSuccessMessage(
            `Nouvelles données détectées : ${fuelNewRecords} enregistrements de carburant, ${flightNewRecords} enregistrements de vol.`
          );
          setTimeout(() => setSuccessMessage(''), 5000);

          if (fuelNewRecords > 0) {
            const processedFuelData = transformData(fuelNewData, FUEL_COLUMNS);
            const newFuelIdentifiers = processedFuelData.map((item) => item['Flight Number']);
            setNewRecords((prev) => ({
              ...prev,
              fuel: [...new Set([...prev.fuel, ...newFuelIdentifiers])],
            }));
            setActiveModal({
              title: 'Nouvelles Données Carburant',
              content: `Affichage des ${fuelNewRecords} nouveaux enregistrements de carburant.`,
              showTable: true,
              processedData: processedFuelData,
              COLUMNS: FUEL_COLUMNS,
              missingField: null,
              missingValue: null,
              onCompleteData: (record, updatedData, updatedProcessedData) =>
                handleCompleteData(record, updatedData, 'fuel', updatedProcessedData),
              onAccept: () => handleAcceptData('fuel', processedFuelData),
              onReject: () => handleRejectData('fuel'),
              onDownload: () => handleDownloadExcel('fuel'),
              showAcceptButton: true,
              newRecords: newFuelIdentifiers,
              dataType: 'fuel',
            });
          } else if (flightNewRecords > 0) {
            const processedFlightData = transformData(flightNewData, FLIGHT_COLUMNS);
            const newFlightIdentifiers = processedFlightData.map((item) => item['Flight ID']);
            setNewRecords((prev) => ({
              ...prev,
              flight: [...new Set([...prev.flight, ...newFlightIdentifiers])],
            }));
            setActiveModal({
              title: 'Nouvelles Données de Vol',
              content: `Affichage des ${flightNewRecords} nouveaux enregistrements de vol.`,
              showTable: true,
              processedData: processedFlightData,
              COLUMNS: FLIGHT_COLUMNS,
              missingField: null,
              missingValue: null,
              onCompleteData: (record, updatedData, updatedProcessedData) =>
                handleCompleteData(record, updatedData, 'flight', updatedProcessedData),
              onAccept: () => handleAcceptData('flight', processedFlightData),
              onReject: () => handleRejectData('flight'),
              onDownload: () => handleDownloadExcel('flight'),
              showAcceptButton: true,
              newRecords: newFlightIdentifiers,
              dataType: 'flight',
            });
          }
        } else {
          setActiveModal({
            title: 'Aucune nouvelle donnée',
            content: 'Aucune nouvelle donnée n’a été détectée dans les fichiers carburant ou vol.',
          });
        }
      } else {
        throw new Error(response.data.message || 'Échec de la vérification des nouvelles données');
      }
    } catch (err) {
      console.error('Erreur lors de la vérification des nouvelles données:', err);
      setError('Erreur lors de la vérification des nouvelles données : ' + err.message);
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDataValidated && !dataType) return;

    const fetchFuelListData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/feuldata', axiosConfig);
        if (response.data.success) {
          setFuelListData(response.data.data);
        } else {
          throw new Error('Failed to fetch fuel list data');
        }
      } catch (err) {
        console.error('Error fetching FuelList data:', err);
        setError('Error fetching FuelList data: ' + err.message);
        setTimeout(() => setError(''), 5000);
      }
    };

    const fetchFlightListData = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/flightdata', axiosConfig);
        if (response.data.success) {
          setFlightListData(response.data.data);
        } else {
          throw new Error('Failed to fetch flight list data');
        }
      } catch (err) {
        console.error('Error fetching FlightList data:', err);
        setError('Error fetching FlightList data: ' + err.message);
        setTimeout(() => setError(''), 5000);
      }
    };

    fetchFuelListData();
    fetchFlightListData();
    loadMergedData(true);

    if (dataType) {
      switch (dataType) {
        case 'fuel':
          showFuelDataInPopup();
          break;
        case 'flight':
          showFlightDataInPopup();
          break;
        case 'merged':
          showMergedDataInPopup();
          break;
        default:
          break;
      }
    }
  }, [dataType, isDataValidated]);

  const showFuelDataInPopup = async () => {
    if (isDataValidated && fuelData.length === 0) {
      setActiveModal({
        title: 'No Data',
        content: 'No fuel data available. Waiting for new data to be uploaded.',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const response = await axios.get('http://localhost:3000/api/data/json/fuel', axiosConfig);

      if (response.data.success) {
        const fileData = response.data.data;
        const processedData = transformData(fileData, FUEL_COLUMNS);
        const existingIdentifiers = fuelData.map((item) => item['Flight Number']);
        const newIdentifiers = processedData
          .filter((item) => !existingIdentifiers.includes(item['Flight Number']))
          .map((item) => item['Flight Number']);
        setNewRecords((prev) => ({
          ...prev,
          fuel: [...new Set([...prev.fuel, ...newIdentifiers])],
        }));
        setFuelData(processedData);
        setSuccessMessage('Fuel consumption data loaded successfully');

        setTimeout(() => setSuccessMessage(''), 3000);

        setActiveModal({
          title: 'Fuel Consumption Data',
          content: 'Displaying fuel consumption details.',
          showTable: true,
          processedData: processedData,
          COLUMNS: FUEL_COLUMNS,
          missingField: dataType === 'fuel' ? fieldName : null,
          missingValue: dataType === 'fuel' ? missingValue : null,
          onCompleteData: (record, updatedData, updatedProcessedData) =>
            handleCompleteData(record, updatedData, 'fuel', updatedProcessedData),
          onAccept: () => handleAcceptData('fuel', processedData),
          onReject: () => handleRejectData('fuel'),
          onDownload: () => handleDownloadExcel('fuel'),
          showAcceptButton: true,
          newRecords: newRecords.fuel,
          dataType: 'fuel',
        });
      } else {
        throw new Error(response.data.message || 'Failed to retrieve fuel data');
      }
    } catch (err) {
      console.error('Error in showFuelDataInPopup:', err);
      setError('Error loading fuel data: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(''), 5000);
      setActiveModal({
        title: 'Error',
        content: 'Failed to load fuel data: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setLoading(false);
    }
  };

  const showFlightDataInPopup = async () => {
    if (isDataValidated && flightData.length === 0) {
      setActiveModal({
        title: 'No Data',
        content: 'No flight data available. Waiting for new data to be uploaded.',
      });
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const response = await axios.get('http://localhost:3000/api/data/json/flight', axiosConfig);

      if (response.data.success) {
        const fileData = response.data.data;
        const processedData = transformData(fileData, FLIGHT_COLUMNS);
        const existingIdentifiers = flightData.map((item) => item['Flight ID']);
        const newIdentifiers = processedData
          .filter((item) => !existingIdentifiers.includes(item['Flight ID']))
          .map((item) => item['Flight ID']);
        setNewRecords((prev) => ({
          ...prev,
          flight: [...new Set([...prev.flight, ...newIdentifiers])],
        }));
        setFlightData(processedData);
        setSuccessMessage('Flight data loaded successfully');

        setTimeout(() => setSuccessMessage(''), 3000);

        setActiveModal({
          title: 'Flight Data',
          content: 'Displaying flight details.',
          showTable: true,
          processedData: processedData,
          COLUMNS: FLIGHT_COLUMNS,
          missingField: dataType === 'flight' ? fieldName : null,
          missingValue: dataType === 'flight' ? missingValue : null,
          onCompleteData: (record, updatedData, updatedProcessedData) =>
            handleCompleteData(record, updatedData, 'flight', updatedProcessedData),
          onAccept: () => handleAcceptData('flight', processedData),
          onReject: () => handleRejectData('flight'),
          onDownload: () => handleDownloadExcel('flight'),
          showAcceptButton: true,
          newRecords: newRecords.flight,
          dataType: 'flight',
        });
      } else {
        throw new Error(response.data.message || 'Failed to retrieve flight data');
      }
    } catch (err) {
      console.error('Error in showFlightDataInPopup:', err);
      setError('Error loading flight data: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(''), 5000);
      setActiveModal({
        title: 'Error',
        content: 'Failed to load flight data: ' + (err.response?.data?.message || err.message),
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMergedData = async (silent = false) => {
    setLoading(true);
    setError(null);
    if (!silent) {
      setSuccessMessage('');
    }

    try {
      const response = await axios.get('http://localhost:3000/api/data/json/merged', axiosConfig);

      if (response.data.success) {
        const fileData = response.data.data;
        const processedData = transformData(fileData, MERGED_COLUMNS);
        const existingIdentifiers = mergedData.map((item) => item['Flight Number']);
        const newIdentifiers = processedData
          .filter((item) => !existingIdentifiers.includes(item['Flight Number']))
          .map((item) => item['Flight Number']);
        setNewRecords((prev) => ({
          ...prev,
          merged: [...new Set([...prev.merged, ...newIdentifiers])],
        }));
        setMergedData((prev) => {
          const combinedData = [...prev];
          processedData.forEach((newItem) => {
            if (!existingIdentifiers.includes(newItem['Flight Number'])) {
              combinedData.push(newItem);
            }
          });
          return combinedData;
        });
        if (!silent) {
          setSuccessMessage('Carbon footprint analysis loaded successfully');
          setTimeout(() => setSuccessMessage(''), 3000);
        }
      } else {
        throw new Error(response.data.message || 'Failed to retrieve merged data');
      }
    } catch (err) {
      console.error('Error loading merged data:', err);
      setError('Error loading merged data: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const showMergedDataInPopup = async () => {
    if (mergedData.length === 0) {
      await loadMergedData(false);
    }

    if (mergedData.length === 0) {
      setActiveModal({
        title: 'Error',
        content: 'No merged data available. Please try loading the data again.',
      });
      return;
    }

    setSuccessMessage('Merged data loaded successfully');
    setTimeout(() => setSuccessMessage(''), 3000);

    setActiveModal({
      title: 'Carbon Footprint Analysis',
      content: 'Displaying combined flight and fuel data for carbon emission tracking.',
      showTable: true,
      processedData: mergedData,
      COLUMNS: MERGED_COLUMNS,
      missingField: dataType === 'merged' ? fieldName : null,
      missingValue: dataType === 'merged' ? missingValue : null,
      onCompleteData: (record, updatedData, updatedProcessedData) =>
        handleCompleteData(record, updatedData, 'merged', updatedProcessedData),
      onReject: () => handleRejectData('merged'),
      onDownload: () => handleDownloadExcel('merged'),
      showAcceptButton: false,
      newRecords: newRecords.merged,
      dataType: 'merged',
    });
  };

  const handleCompleteData = async (record, updatedData, type, updatedProcessedData) => {
    setLoading(true);
    setError(null);

    try {
      const identifier = type === 'flight' ? record['Flight ID'] : record['Flight Number'];
      const dateOfFlight =
        type === 'flight' ? record['Date of operation (UTC)'] : record['Date of Flight'];

      if (!identifier || !dateOfFlight) {
        throw new Error('Missing flight identifier or date of flight');
      }

      const response = await axios.put(
        `http://localhost:3000/api/edit/${type}`,
        updatedData,
        {
          ...axiosConfig,
          params: {
            flightNumber: identifier,
            dateOfFlight: dateOfFlight,
          },
        }
      );

      if (response.data.success) {
        setSuccessMessage('Row updated successfully');
        setTimeout(() => setSuccessMessage(''), 3000);

        setNewRecords((prev) => ({
          ...prev,
          [type]: [...new Set([...prev[type], identifier])],
        }));

        if (type === 'fuel') {
          setFuelData(updatedProcessedData);
          setActiveModal((prev) => ({
            ...prev,
            processedData: updatedProcessedData,
            newRecords: newRecords.fuel,
          }));
        } else if (type === 'flight') {
          setFlightData(updatedProcessedData);
          setActiveModal((prev) => ({
            ...prev,
            processedData: updatedProcessedData,
            newRecords: newRecords.flight,
          }));
        } else if (type === 'merged') {
          setMergedData(updatedProcessedData);
          setActiveModal((prev) => ({
            ...prev,
            processedData: updatedProcessedData,
            newRecords: newRecords.merged,
          }));
        }
      } else {
        throw new Error(response.data.message || 'Failed to update row');
      }
    } catch (err) {
      console.error('Error updating row:', err);
      setError('Error updating row: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptData = async (type, records) => {
    setLoading(true);
    setError(null);

    try {
      console.log(`Initiating data transfer for type: ${type}`);
      const response = await axios.post(
        'http://localhost:3000/api/transfer/extract-and-transfer-new-data',
        {
          dataType: type,
          records: records,
        },
        axiosConfig
      );

      console.log('API response:', response.data);

      if (response.data.success) {
        setSuccessMessage(
          `Données ${type} transférées avec succès ! ${response.data.count} records`
        );
        setIsDataValidated(true);

        // Keep the modal open to allow further interaction
        setFuelData(type === 'fuel' ? records : fuelData);
        setFlightData(type === 'flight' ? records : flightData);
        setNewRecords((prev) => ({ ...prev, [type]: [] }));

        if (type === 'fuel') {
          navigate('/fuel-data');
        } else if (type === 'flight') {
          navigate('/flight-list');
        }

        setTimeout(() => setSuccessMessage(''), 5000);
      } else {
        throw new Error(response.data.message || `Échec du transfert des données ${type}`);
      }
    } catch (err) {
      console.error('Erreur lors de la validation :', err);
      setError(
        err.response?.data?.message ||
          `Échec de la validation des données ${type} : ${err.message}`
      );
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectData = async (type) => {
    setLoading(true);
    setError(null);
  
    try {
      const token = localStorage.getItem('token');
      const decoded = jwtDecode(token);
      console.log("🧾 Token décodé :", decoded); 
       const userId = decoded?.userId || decoded?.id || decoded?._id;
  
      const response = await axios.post(
        'http://localhost:3000/api/notifications/send',
        {
          userId, // ✅ maintenant inclus
          type: 'importation_data_refusée',
          message: `Les données ${type} ont été refusées.`,
          metadata: { dataType: type },
        },
        axiosConfig
      );
  
      if (response.data.success) {
        setSuccessMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} data rejected and notification sent`);
      } else {
        throw new Error(response.data.message || 'Failed to send rejection notification');
      }
  
      setTimeout(() => {
        setSuccessMessage('');
        setActiveModal(null);
      }, 2000);
    } catch (err) {
      console.error('Error sending rejection notification:', err);
      setError('Error sending rejection notification: ' + (err.response?.data?.message || err.message));
      setTimeout(() => setError(''), 5000);
    } finally {
      setLoading(false);
    }
  };
  

  const actionItems = [
    {
      id: 'fuel',
      content: (
        <>
          <i className="fas fa-gas-pump"></i>
          <span>
            <strong>Voir Données Carburant :</strong> Explorez les détails de la
            consommation de carburant.
          </span>
        </>
      ),
      onClick: () => showFuelDataInPopup(),
    },
    {
      id: 'flight',
      content: (
        <>
          <i className="fas fa-plane"></i>
          <span>
            <strong>Voir Données Vol :</strong> Accédez aux enregistrements des
            opérations de vol.
          </span>
        </>
      ),
      onClick: () => showFlightDataInPopup(),
    },
    {
      id: 'merged',
      content: (
        <>
          <i className="fas fa-leaf"></i>
          <span>
            <strong>Voir Données Fusionnées :</strong> Analysez les données
            combinées pour des insights sur l'empreinte carbone.
          </span>
        </>
      ),
      onClick: () => showMergedDataInPopup(),
    },
    {
      id: 'check-new-data',
      content: (
        <>
          <i className="fas fa-sync-alt"></i>
          <span>
            <strong>Vérifier Nouvelles Données :</strong> Vérifiez s’il y a de nouvelles données carburant ou vol.
          </span>
        </>
      ),
      onClick: () => handleCheckNewData(),
    },
  ];

  return (
    <div className="container-fluid">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          <header className="carbon-header">
            <h1>Suivi de l'Émission de Carbone & Consommation Fuel</h1>
            <p>
              Suivez les émissions de l'aviation et optimisez la consommation de carburant
              pour un avenir durable.
            </p>
          </header>

          <div className="status-messages">
            {error && (
              <div className="alert alert-danger">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
            )}
            {successMessage && (
              <div className="alert alert-success">
                <i className="fas fa-check-circle"></i>
                <span>{successMessage}</span>
              </div>
            )}
            {loading && (
              <div className="alert alert-warning">
                <i className="fas fa-spinner fa-spin"></i>
                <span>Chargement des données... Veuillez patienter</span>
              </div>
            )}
            {isDataValidated && !successMessage && !error && !loading && (
              <div className="alert alert-info">
                <i className="fas fa-info-circle"></i>
                <span>En attente de nouvelles données à valider.</span>
              </div>
            )}
          </div>

          <div className="data-container">
            <div className="welcome-section">
              <h2>Surveillez l'Impact de l'Aviation</h2>
              <p>
                Bienvenue sur votre plateforme de suivi carbone. Cliquez sur les options
                ci-dessous pour analyser la consommation de carburant, les détails des vols
                et les données combinées pour une vision complète des émissions carbone.
              </p>
              <div className="row justify-content-center mt-4">
                {actionItems.map((item) => (
                  <div key={item.id} className="col-md-4 mb-3">
                    <div
                      className="card h-100"
                      onClick={item.onClick}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="card-body">
                        <div className="d-flex align-items-center mb-3">
                          <div className="icon-circle bg-primary text-white">
                            {item.content.props.children[0]}
                          </div>
                          <h5 className="card-title ms-3">
                            {item.content.props.children[1].props.children[0]}
                          </h5>
                        </div>
                        <p className="card-text">
                          {item.content.props.children[1].props.children[1]}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {activeModal && (
        <Modal
          title={activeModal.title}
          content={activeModal.content}
          onClose={() => setActiveModal(null)}
          onAccept={activeModal.onAccept}
          onReject={activeModal.onReject}
          showTable={activeModal.showTable}
          processedData={activeModal.processedData || []}
          COLUMNS={activeModal.COLUMNS || FUEL_COLUMNS}
          missingField={activeModal.missingField}
          missingValue={activeModal.missingValue}
          onCompleteData={activeModal.onCompleteData}
          onDownload={activeModal.onDownload}
          showAcceptButton={activeModal.showAcceptButton}
          newRecords={activeModal.newRecords}
          dataType={activeModal.dataType}
          isAuthorized={isAuthorized}

        />
      )}
    </div>
  );
};

export default FuelDashboard;