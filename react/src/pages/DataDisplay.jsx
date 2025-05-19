import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tabs, TabList, Tab, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';
import { Table, Button, Spinner, Alert, Badge, Card } from 'react-bootstrap';

const DataVisualizer = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [fuelData, setFuelData] = useState([]);
  const [flightData, setFlightData] = useState([]);
  const [mergedData, setMergedData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [processStatus, setProcessStatus] = useState(null);

  useEffect(() => {
    fetchAllData();
    
    // Vérifier le statut toutes les 5 secondes pendant une mise à jour
    let intervalId;
    if (refreshing) {
      intervalId = setInterval(() => {
        checkProcessStatus();
      }, 5000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [refreshing]);

  const fetchAllData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [fuelResponse, flightResponse, mergedResponse, updateResponse] = await Promise.all([
        axios.get('/api/data/fuel'),
        axios.get('/api/data/flights'),
        axios.get('/api/data/merged'),
        axios.get('/api/data/last-update')
      ]);
      
      setFuelData(fuelResponse.data);
      setFlightData(flightResponse.data);
      setMergedData(mergedResponse.data);
      setLastUpdate(new Date(updateResponse.data.timestamp));
    } catch (err) {
      setError('Erreur lors du chargement des données: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const checkProcessStatus = async () => {
    try {
      const response = await axios.get('/api/data/process-status');
      setProcessStatus(response.data.status);
      
      if (response.data.status === 'completed' || response.data.status === 'failed') {
        setRefreshing(false);
        fetchAllData();
      }
    } catch (err) {
      console.error("Erreur lors de la vérification du statut:", err);
    }
  };

  const triggerDataUpdate = async () => {
    setRefreshing(true);
    setProcessStatus('starting');
    
    try {
      await axios.post('/api/data/process');
      setProcessStatus('processing');
    } catch (err) {
      setError('Erreur lors de la mise à jour des données: ' + (err.response?.data?.message || err.message));
      setRefreshing(false);
      setProcessStatus('failed');
    }
  };

  const renderDataTable = (data, title) => {
    if (!data || data.length === 0) {
      return <Alert variant="info">Aucune donnée disponible pour {title}</Alert>;
    }

    const headers = Object.keys(data[0]);
    
    return (
      <div className="table-responsive">
        <h3>{title}</h3>
        <Table striped bordered hover size="sm">
          <thead>
            <tr>
              {headers.map(header => (
                <th key={header}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 10).map((row, rowIndex) => (
              <tr key={rowIndex}>
                {headers.map(header => (
                  <td key={`${rowIndex}-${header}`}>
                    {row[header] !== null && row[header] !== undefined ? row[header].toString() : 'N/A'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
        {data.length > 10 && (
          <div className="text-center mb-4">
            <Badge bg="secondary">{data.length - 10} entrées supplémentaires non affichées</Badge>
          </div>
        )}
      </div>
    );
  };

  const renderStatusBadge = () => {
    if (!processStatus) return null;
    
    const statusMap = {
      'starting': { color: 'info', text: 'Démarrage du processus...' },
      'processing': { color: 'warning', text: 'Traitement en cours...' },
      'completed': { color: 'success', text: 'Traitement terminé avec succès' },
      'failed': { color: 'danger', text: 'Échec du traitement' }
    };

    const status = statusMap[processStatus] || { color: 'secondary', text: processStatus };
    
    return (
      <Badge bg={status.color} className="ms-2 py-2 px-3">
        {status.text}
      </Badge>
    );
  };

  return (
    <div className="container mt-4 mb-5">
      <Card className="shadow-sm">
        <Card.Header as="h2" className="bg-primary bg-gradient text-white">
          Visualiseur de Données d'Extraction
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4>Données de carburant, vols et données fusionnées</h4>
              {lastUpdate && (
                <div className="text-muted">
                  Dernière mise à jour: {lastUpdate.toLocaleString()}
                </div>
              )}
            </div>
            <div className="d-flex align-items-center">
              {renderStatusBadge()}
              <Button 
                variant="primary" 
                onClick={triggerDataUpdate}
                disabled={refreshing}
                className="ms-2"
              >
                {refreshing ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" /> Mise à jour en cours...
                  </>
                ) : 'Lancer l\'extraction et la mise à jour'}
              </Button>
            </div>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {loading ? (
            <div className="text-center my-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Chargement des données...</p>
            </div>
          ) : (
            <Tabs selectedIndex={activeTab} onSelect={index => setActiveTab(index)} className="mb-4">
              <TabList className="nav nav-tabs mb-3">
                <Tab className="nav-item">
                  <button className={`nav-link ${activeTab === 0 ? 'active' : ''}`}>Données de Carburant</button>
                </Tab>
                <Tab className="nav-item">
                  <button className={`nav-link ${activeTab === 1 ? 'active' : ''}`}>Données de Vols</button>
                </Tab>
                <Tab className="nav-item">
                  <button className={`nav-link ${activeTab === 2 ? 'active' : ''}`}>Données Fusionnées</button>
                </Tab>
              </TabList>

              <TabPanel>
                {renderDataTable(fuelData, 'Extraction de Carburant')}
              </TabPanel>
              <TabPanel>
                {renderDataTable(flightData, 'Extraction de Vols')}
              </TabPanel>
              <TabPanel>
                {renderDataTable(mergedData, 'Données Fusionnées')}
              </TabPanel>
            </Tabs>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default DataVisualizer;