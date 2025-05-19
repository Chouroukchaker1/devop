import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./DataEditComponent.css";

const DataEditComponent = () => {
  const navigate = useNavigate();
  const [dataType, setDataType] = useState("fuel");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [editModal, setEditModal] = useState(null);
  const [filter, setFilter] = useState({ flightNumber: "", dateOfFlight: "" });

  const token = localStorage.getItem("token");
  const axiosConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  const FUEL_COLUMNS = [
    { key: "Date of Flight", label: "Date of Flight" },
    { key: "Time of Departure", label: "Time of Departure" },
    { key: "Flight Number", label: "Flight Number" },
    { key: "DepartureAirport", label: "DepartureAirport" },
    { key: "ArrivalAirport", label: "ArrivalAirport" },
    { key: "TaxiFuel", label: "TaxiFuel" },
    { key: "TripFuel", label: "TripFuel" },
    { key: "ContingencyFuel", label: "ContingencyFuel" },
    { key: "BlockFuel", label: "BlockFuel" },
    { key: "FinalReserveFuel", label: "FinalReserveFuel" },
    { key: "AdditionalFuel", label: "Additional Fuel (tonnes)" },
    { key: "DiscretionaryFuel", label: "Discretionary Fuel" },
    { key: "ExtraFuel", label: "ExtraFuel" },
    { key: "Reason", label: "Reason" },
    {
      key: "TankeringCategory",
      label: "Economic tankering category in the flight plan",
    },
    { key: "AlternateFuel", label: "AlternateFuel" },
    { key: "AlternateArrivalAirport", label: "Alternate Arrival Airport" },
    { key: "FOB", label: "FOB" },
  ];

  const FLIGHT_COLUMNS = [
    { key: "Date of operation (UTC)", label: "Date of operation (UTC)" },
    { key: "AC registration", label: "AC registration" },
    { key: "Flight ID", label: "Flight ID" },
    { key: "ICAO Call sign", label: "ICAO Call sign" },
    { key: "AC Type", label: "AC Type" },
    { key: "Flight type", label: "Flight type" },
    { key: "Departing Airport ICAO Code", label: "Departing Airport ICAO Code" },
    {
      key: "Departure Time/ Block-off time (UTC)",
      label: "Departure Time/ Block-off time (UTC)",
    },
    {
      key: "Destination Airport ICAO Code",
      label: "Destination Airport ICAO Code",
    },
    {
      key: "Arrival Time/ Block-on Time(UTC)",
      label: "Arrival Time/ Block-on Time(UTC)",
    },
    { key: "Uplift Volume (Litres)", label: "Uplift Volume (Litres)" },
    { key: "Uplift density", label: "Uplift density" },
    { key: "Block On (tonnes)", label: "Block On (tonnes)" },
    { key: "Block Off (tonnes)", label: "Block Off (tonnes)" },
  ];

  const MERGED_COLUMNS = [
    { key: "Date of Flight", label: "Date of Flight" },
    { key: "AC registration", label: "AC registration" },
    { key: "Flight Number", label: "Flight Number" },
    { key: "ICAO Call sign", label: "ICAO Call sign" },
    { key: "AC Type", label: "AC Type" },
    { key: "Flight type", label: "Flight type" },
    { key: "DepartureAirport", label: "DepartureAirport" },
    { key: "ArrivalAirport", label: "ArrivalAirport" },
    { key: "Time of Departure", label: "Time of Departure" },
    {
      key: "Arrival Time/ Block-on Time(UTC)",
      label: "Arrival Time/ Block-on Time(UTC)",
    },
    { key: "TaxiFuel", label: "TaxiFuel" },
    { key: "TripFuel", label: "TripFuel" },
    { key: "Uplift Volume (Litres)", label: "Uplift Volume (Litres)" },
    { key: "Uplift density", label: "Uplift density" },
    { key: "ContingencyFuel", label: "ContingencyFuel" },
    { key: "AlternateFuel", label: "AlternateFuel" },
    { key: "FinalReserveFuel", label: "FinalReserveFuel" },
    { key: "DiscretionaryFuel", label: "Discretionary Fuel" },
    { key: "ExtraFuel", label: "ExtraFuel" },
    { key: "AdditionalFuel", label: "Additional Fuel (tonnes)" },
    { key: "Reason", label: "Reason" },
    {
      key: "TankeringCategory",
      label: "Economic tankering category in the flight plan",
    },
    { key: "Block Off (tonnes)", label: "Block Off (tonnes)" },
    { key: "Block On (tonnes)", label: "Block On (tonnes)" },
    { key: "BlockFuel", label: "BlockFuel" },
    { key: "AlternateArrivalAirport", label: "Alternate Arrival Airport" },
    { key: "FOB", label: "FOB" },
    { key: "CompleteData", label: "CompleteData" },
  ];

  const getColumns = () => {
    switch (dataType) {
      case "fuel":
        return FUEL_COLUMNS;
      case "flight":
        return FLIGHT_COLUMNS;
      case "merged":
        return MERGED_COLUMNS;
      default:
        return FUEL_COLUMNS;
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/data/json/${dataType}`,
        axiosConfig
      );
      if (response.data.success) {
        setData(response.data.data);
      } else {
        throw new Error(
          response.data.message || `Failed to fetch ${dataType} data`
        );
      }
    } catch (err) {
      setError(`Error fetching ${dataType} data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterSubmit = async (e) => {
    e.preventDefault();
    if (!filter.flightNumber || !filter.dateOfFlight) {
      setError("Please provide both Flight Number/ID and Date of Flight/Operation");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `http://localhost:3000/api/edit/${dataType}`,
        {
          ...axiosConfig,
          params: {
            flightNumber: filter.flightNumber,
            dateOfFlight: filter.dateOfFlight
          }
        }
      );
      if (response.data.success) {
        setData([response.data.data]);
        setSuccessMessage("Record fetched successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        throw new Error(response.data.message || "Record not found");
      }
    } catch (err) {
      setError(`Error fetching record: ${err.response?.data?.message || err.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

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

  const handleSaveChanges = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!dataType) {
        throw new Error("Data type is not selected");
      }
      if (!editModal) {
        throw new Error("No record selected for editing");
      }
      const { record, updatedData } = editModal;
      const flightNumber =
        dataType === "flight" ? record["Flight ID"] : record["Flight Number"];
      const dateOfFlight =
        dataType === "flight"
          ? record["Date of operation (UTC)"]
          : record["Date of Flight"];

      if (!flightNumber || !dateOfFlight) {
        throw new Error("Missing flight number/ID or date of flight/operation");
      }

      console.log('Sending PUT request:', {
        url: `http://localhost:3000/api/edit/${dataType}`,
        flightNumber,
        dateOfFlight,
        updatedData
      });

      const response = await axios.put(
        `http://localhost:3000/api/edit/${dataType}`,
        updatedData,
        {
          ...axiosConfig,
          params: {
            flightNumber: flightNumber,
            dateOfFlight: dateOfFlight
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage("Record updated successfully");
        setTimeout(() => setSuccessMessage(""), 3000);
        setData((prev) =>
          prev.map((item) =>
            (dataType === "flight"
              ? item["Flight ID"] === flightNumber &&
                item["Date of operation (UTC)"] === dateOfFlight
              : item["Flight Number"] === flightNumber &&
                item["Date of Flight"] === dateOfFlight)
              ? response.data.data
              : item
          )
        );
        setEditModal(null);
      } else {
        throw new Error(response.data.message || "Failed to update record");
      }
    } catch (err) {
      setError(`Error updating record: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dataType]);

  return (
    <div className="container-fluid mt-4">
      <h2>Edit {dataType.charAt(0).toUpperCase() + dataType.slice(1)} Data</h2>

      <div className="mb-3">
        <label htmlFor="dataType" className="form-label">
          Select Data Type:
        </label>
        <select
          id="dataType"
          className="form-select w-25"
          value={dataType}
          onChange={(e) => {
            console.log('Selected dataType:', e.target.value);
            setDataType(e.target.value);
            setFilter({ flightNumber: "", dateOfFlight: "" });
            setData([]);
          }}
        >
          <option value="fuel">Fuel</option>
          <option value="flight">Flight</option>
          <option value="merged">Merged</option>
        </select>
      </div>

      <form onSubmit={handleFilterSubmit} className="mb-3">
        <div className="row g-3">
          <div className="col-md-4">
            <label htmlFor="flightNumber" className="form-label">
              {dataType === "flight" ? "Flight ID" : "Flight Number"}
            </label>
            <input
              type="text"
              id="flightNumber"
              className="form-control"
              value={filter.flightNumber}
              onChange={(e) =>
                setFilter({ ...filter, flightNumber: e.target.value })
              }
            />
          </div>
          <div className="col-md-4">
            <label htmlFor="dateOfFlight" className="form-label">
              Date of {dataType === "flight" ? "Operation (UTC)" : "Flight"}
            </label>
            <input
              type="text"
              id="dateOfFlight"
              className="form-control"
              value={filter.dateOfFlight}
              onChange={(e) =>
                setFilter({ ...filter, dateOfFlight: e.target.value })
              }
              placeholder="e.g., 2024-05-14 or 14-05-2024"
            />
          </div>
          <div className="col-md-4 d-flex align-items-end">
            <button type="submit" className="btn btn-primary me-2">
              <i className="fas fa-search"></i> Filter
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setFilter({ flightNumber: "", dateOfFlight: "" });
                fetchData();
              }}
            >
              <i className="fas fa-sync"></i> Reset
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="alert alert-danger">
          <i className="fas fa-exclamation-circle"></i> {error}
        </div>
      )}
      {successMessage && (
        <div className="alert alert-success">
          <i className="fas fa-check-circle"></i> {successMessage}
        </div>
      )}
      {loading && (
        <div className="alert alert-warning">
          <i className="fas fa-spinner fa-spin"></i> Loading...
        </div>
      )}

      {data.length > 0 ? (
        <div className="table-responsive">
          <table className="table table-striped table-bordered">
            <thead className="thead-dark">
              <tr>
                {getColumns().map((column) => (
                  <th key={column.key}>{column.label}</th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((record, index) => (
                <tr key={index}>
                  {getColumns().map((column) => (
                    <td key={column.key}>{record[column.key] || ""}</td>
                  ))}
                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => handleEditClick(record)}
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>No records found. Try adjusting the filter or resetting it.</p>
      )}

      {editModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="close-btn"
              onClick={() => setEditModal(null)}
            >
              <i className="fas fa-times"></i>
            </button>
            <h2>
              Edit {dataType.charAt(0).toUpperCase() + dataType.slice(1)} Record
            </h2>
            <form>
              <div className="scrollable-form">
                {getColumns().map((column) => (
                  <div key={column.key} className="mb-3">
                    <label className="form-label">{column.label}</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editModal.updatedData[column.key] || ""}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default DataEditComponent;