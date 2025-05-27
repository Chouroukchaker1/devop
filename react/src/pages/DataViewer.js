import React, { useState, useEffect } from 'react';
import { Table, Button, Tabs, Tab, Alert, Spinner, Container, Badge } from 'react-bootstrap';
import { FaSync, FaTable, FaFileExcel, FaFileCsv, FaFileCode, FaCog } from 'react-icons/fa';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { saveAs } from 'file-saver';
import './DataViewer.css';

// Configuration d'axios avec la base URL
const API_BASE_URL = 'http://localhost:8082'; // Ajustez selon votre port et domaine
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const DataViewer = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const defaultSettings = {
    defaultDataType: 'fuel',
    maxTableRows: 100,
    autoRefresh: false,
    refreshInterval: 5,
    defaultFormat: 'json',
    showStatistics: true,
    darkMode: false,
    compactView: false
  };

  // Récupérer les paramètres des props de navigation ou utiliser les valeurs par défaut
  const userSettings = location.state?.settings || defaultSettings;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(userSettings.defaultFormat);
  const [dataType, setDataType] = useState(userSettings.defaultDataType);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [refreshTimer, setRefreshTimer] = useState(null);

  const navigateToSettings = () => {
    navigate('/settings');
  };

  const fetchJsonData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log(`Fetching JSON data for ${dataType} from ${API_BASE_URL}/api/data/json/${dataType}`);
      const response = await api.get(`/api/data/json/${dataType}`);
      if (response.data && response.data.data) {
        setData(response.data.data);
        console.log(`Successfully loaded ${response.data.data.length} records`);
      } else {
        setData([]);
        console.warn('Response format unexpected:', response.data);
      }
    } catch (err) {
      console.error('Error fetching JSON data:', err);
      setError(err.response?.data?.message || `Erreur lors du chargement des données: ${err.message}`);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format) => {
    setDownloadStatus(`Téléchargement ${format} en cours...`);
    setError('');
    
    try {
      console.log(`Downloading ${format} file for ${dataType}`);
      const response = await api.get(`/api/data/${format}/${dataType}`, {
        responseType: 'blob',
        headers: {
          'Accept': getContentType(format),
        }
      });
      
      // Créer un nom de fichier approprié
      const filename = `${dataType}_data.${getFileExtension(format)}`;
      
      // Créer un blob et télécharger le fichier
      const blob = new Blob([response.data], { type: getContentType(format) });
      saveAs(blob, filename);
      
      setDownloadStatus(`${format.toUpperCase()} téléchargé avec succès!`);
      setTimeout(() => setDownloadStatus(''), 3000);
    } catch (err) {
      console.error(`Error downloading ${format}:`, err);
      setError(`Erreur lors du téléchargement du fichier ${format}: ${err.message}`);
      setDownloadStatus('');
    }
  };

  // Helper fonction pour déterminer le type de contenu en fonction du format
  const getContentType = (format) => {
    switch (format.toLowerCase()) {
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv':
        return 'text/csv';
      case 'xml':
        return 'application/xml';
      default:
        return 'application/json';
    }
  };

  // Helper fonction pour obtenir l'extension de fichier correcte
  const getFileExtension = (format) => {
    switch (format.toLowerCase()) {
      case 'excel':
        return 'xlsx';
      case 'csv':
        return 'csv';
      case 'xml':
        return 'xml';
      default:
        return 'json';
    }
  };

  // Configurer l'actualisation automatique
  useEffect(() => {
    // Nettoyer le timer existant
    if (refreshTimer) {
      clearInterval(refreshTimer);
    }
    
    // Mettre en place un nouveau timer si l'actualisation auto est activée
    if (userSettings.autoRefresh) {
      const timer = setInterval(() => {
        if (activeTab === 'json') {
          fetchJsonData();
        }
      }, userSettings.refreshInterval * 60 * 1000);
      setRefreshTimer(timer);
    }
    
    return () => {
      if (refreshTimer) {
        clearInterval(refreshTimer);
      }
    };
  }, [userSettings.autoRefresh, userSettings.refreshInterval, dataType, activeTab]);

  // Charger les données lorsque le type de données ou l'onglet change
  useEffect(() => {
    if (activeTab === 'json') {
      fetchJsonData();
    }
  }, [dataType, activeTab]);

  const renderTable = () => {
    if (!data || data.length === 0) {
      return <Alert variant="info">Aucune donnée disponible</Alert>;
    }
    
    const columns = Object.keys(data[0]);
    const maxRows = userSettings.maxTableRows; // Utiliser la valeur des paramètres
    
    return (
      <div className={`table-responsive ${userSettings.compactView ? 'table-compact' : ''}`}>
        {data.length > maxRows && (
          <Alert variant="warning">
            Affichage limité aux {maxRows} premières lignes sur {data.length} disponibles
          </Alert>
        )}
        <Table 
          striped 
          bordered 
          hover 
          size={userSettings.compactView ? "sm" : "md"}
          variant={userSettings.darkMode ? "dark" : "light"}
        >
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, maxRows).map((row, index) => (
              <tr key={index}>
                {columns.map(col => (
                  <td key={`${col}-${index}`}>
                    {row[col] !== null && row[col] !== undefined ? row[col].toString() : 'N/A'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    );
  };

  return (
    <Container className={`data-viewer-container mt-4 ${userSettings.darkMode ? 'dark-mode' : ''}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2><FaTable className="me-2" />Visualiseur de Données</h2>
        <Button variant="outline-secondary" onClick={navigateToSettings}>
          <FaCog className="me-2" />Paramètres
        </Button>
      </div>
      
      <div className="data-type-selector mb-4">
        <Button 
          variant={dataType === 'fuel' ? 'primary' : 'outline-primary'} 
          onClick={() => setDataType('fuel')}
          className="me-2"
        >
          Données Carburant
        </Button>
        <Button 
          variant={dataType === 'flight' ? 'primary' : 'outline-primary'} 
          onClick={() => setDataType('flight')}
          className="me-2"
        >
          Données Vol
        </Button>
        <Button 
          variant={dataType === 'merged' ? 'primary' : 'outline-primary'} 
          onClick={() => setDataType('merged')}
        >
          Données Fusionnées
        </Button>
        
        {userSettings.autoRefresh && (
          <div className="ms-auto d-flex align-items-center">
            <FaSync className={`text-primary me-2 ${loading ? 'fa-spin' : ''}`} />
            <small className="text-muted">
              Actualisation auto: {userSettings.refreshInterval} min
            </small>
          </div>
        )}
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {downloadStatus && (
        <Alert variant="success">
          <Spinner animation="border" size="sm" className="me-2" />
          {downloadStatus}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(k) => setActiveTab(k)}
        className="mb-3"
        id="data-viewer-tabs"
      >
        <Tab eventKey="json" title={<span><FaTable className="me-2" />Visualiser</span>}>
          {loading ? (
            <div className="text-center py-4">
              <Spinner animation="border" />
              <p className="mt-2">Chargement des données...</p>
            </div>
          ) : (
            renderTable()
          )}
        </Tab>
        <Tab eventKey="excel" title={<span><FaFileExcel className="me-2" />Excel</span>}>
          <div className="download-section p-4 text-center">
            <h4>Télécharger les données au format Excel</h4>
            <p>Le fichier Excel contiendra toutes les données {dataType === 'fuel' ? 'de carburant' : dataType === 'flight' ? 'de vol' : 'fusionnées'}</p>
            <Button 
              variant="success" 
              size="lg"
              onClick={() => handleDownload('excel')} 
              disabled={loading}
              className="mt-2"
            >
              <FaFileExcel className="me-2" />
              Télécharger Excel
            </Button>
          </div>
        </Tab>
        <Tab eventKey="csv" title={<span><FaFileCsv className="me-2" />CSV</span>}>
          <div className="download-section p-4 text-center">
            <h4>Télécharger les données au format CSV</h4>
            <p>Format CSV parfait pour l'importation dans des outils d'analyse</p>
            <Button 
              variant="info" 
              size="lg"
              onClick={() => handleDownload('csv')} 
              disabled={loading}
              className="mt-2"
            >
              <FaFileCsv className="me-2" />
              Télécharger CSV
            </Button>
          </div>
        </Tab>
        <Tab eventKey="xml" title={<span><FaFileCode className="me-2" />XML</span>}>
          <div className="download-section p-4 text-center">
            <h4>Télécharger les données au format XML</h4>
            <p>Format XML pour l'intégration avec d'autres systèmes</p>
            <Button 
              variant="warning" 
              size="lg"
              onClick={() => handleDownload('xml')} 
              disabled={loading}
              className="mt-2"
            >
              <FaFileCode className="me-2" />
              Télécharger XML
            </Button>
          </div>
        </Tab>
      </Tabs>

      {userSettings.showStatistics && data.length > 0 && (
        <div className="mt-4 statistics-section">
          <h5>Statistiques</h5>
          <div className="d-flex flex-wrap gap-3">
            <Badge bg="primary" className="p-2">Type de données: {dataType}</Badge>
            <Badge bg="secondary" className="p-2">Nombre d'enregistrements: {data.length}</Badge>
            <Badge bg="info" className="p-2">Colonnes: {Object.keys(data[0]).length}</Badge>
            <Badge bg="success" className="p-2">Dernière actualisation: {new Date().toLocaleTimeString()}</Badge>
          </div>
        </div>
      )}
    </Container>
  );
};

export default DataViewer;