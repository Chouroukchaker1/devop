import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Spinner, Modal, Dropdown, Table } from 'react-bootstrap';
import { FaSave, FaBell, FaClock, FaUsers, FaTable, FaFileExcel, FaFileCsv, FaFileCode, FaUser } from 'react-icons/fa';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { saveAs } from 'file-saver';
import Profile from './Profile';
import './SettingsPage.css';

const api = axios.create({
  baseURL: 'http://localhost:8082',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/connexion';
    }
    return Promise.reject(error);
  }
);

const SettingsPage = () => {
  const [settings, setSettings] = useState({
    notifications: { enable: true },
    schedulerConfig: {
      enabled: false,
      startDate: null,
      hours: [],
      days: [],
      months: [],
      weekdays: [],
    },
    dataViewer: { defaultFormat: 'json' },
  });
  const userRole = localStorage.getItem('userRole');
  const [saveStatus, setSaveStatus] = useState({ show: false, message: '', variant: 'success' });
  const [loading, setLoading] = useState(true);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState(null);
  const [downloadStatus, setDownloadStatus] = useState('');
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const settingsResponse = await api.get('/api/user-settings');
        if (settingsResponse.data.success && settingsResponse.data.settings) {
          setSettings({
            notifications: {
              enable: settingsResponse.data.settings.notifications?.enable ?? true,
            },
            schedulerConfig: {
              enabled: settingsResponse.data.settings.schedulerConfig?.enabled ?? false,
              startDate: settingsResponse.data.settings.schedulerConfig?.startDate
                ? new Date(settingsResponse.data.settings.schedulerConfig.startDate)
                : null,
              hours: settingsResponse.data.settings.schedulerConfig?.hours ?? [],
              days: settingsResponse.data.settings.schedulerConfig?.days ?? [],
              months: settingsResponse.data.settings.schedulerConfig?.months ?? [],
              weekdays: settingsResponse.data.settings.schedulerConfig?.weekdays ?? [],
            },
            dataViewer: {
              defaultFormat: settingsResponse.data.settings.dataViewer?.defaultFormat ?? 'json',
            },
          });
        }
      } catch (error) {
        setSaveStatus({
          show: true,
          message: error.response?.data?.message || 'Erreur lors de la récupération des paramètres',
          variant: 'danger',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/api/auth/getUsers');
      setUsers(res.data.users);
    } catch (err) {
      setSaveStatus({
        show: true,
        message: 'Erreur lors de la récupération des utilisateurs',
        variant: 'danger',
      });
    }
  };

  const toggleAccount = async (userId, currentStatus) => {
    try {
      await api.patch('/api/auth/toggle-active', {
        userId,
        isActive: !currentStatus,
      });
      setUsers(users.map((user) =>
        user._id === userId ? { ...user, isActive: !currentStatus } : user
      ));
      setSaveStatus({
        show: true,
        message: 'Statut du compte utilisateur mis à jour',
        variant: 'success',
      });
    } catch (error) {
      setSaveStatus({
        show: true,
        message: error.response?.data?.message || 'Erreur lors de la modification du statut du compte utilisateur',
        variant: 'danger',
      });
    }
  };

  const saveSettings = async (section) => {
    try {
      let response;
      if (section === 'notifications') {
        response = await api.put('/api/user-settings/notifications', {
          notifications: settings.notifications,
        });
      } else if (section === 'dataViewer') {
        response = await api.put('/api/user-settings/data-viewer', {
          dataViewer: settings.dataViewer,
        });
      } else if (section === 'schedulerConfig') {
        response = await api.put('/api/user-settings/scheduler', {
          schedulerConfig: {
            ...settings.schedulerConfig,
            startDate: settings.schedulerConfig.startDate
              ? settings.schedulerConfig.startDate.toISOString()
              : null,
          },
        });
      }
      if (response.data.success) {
        setSaveStatus({ show: true, message: response.data.message || 'Paramètres enregistrés avec succès', variant: 'success' });
        setTimeout(() => setSaveStatus((prev) => ({ ...prev, show: false })), 3000);
      }
    } catch (error) {
      setSaveStatus({
        show: true,
        message: error.response?.data?.message || `Erreur lors de l'enregistrement des paramètres ${section}`,
        variant: 'danger',
      });
    }
  };

  const toggleScheduler = async () => {
    try {
      const response = await api.patch('/api/user-settings/scheduler/toggle', {
        enabled: !settings.schedulerConfig.enabled,
      });
      if (response.data.success) {
        setSettings((prev) => ({
          ...prev,
          schedulerConfig: {
            ...prev.schedulerConfig,
            enabled: response.data.settings.schedulerConfig.enabled,
          },
        }));
        setSaveStatus({ show: true, message: response.data.message || 'Statut du planificateur mis à jour', variant: 'success' });
        setTimeout(() => setSaveStatus((prev) => ({ ...prev, show: false })), 3000);
      }
    } catch (error) {
      setSaveStatus({
        show: true,
        message: error.response?.data?.message || 'Erreur lors de la modification du planificateur',
        variant: 'danger',
      });
    }
  };

  const handleChange = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleDateTimeChange = (date) => {
    handleChange('schedulerConfig', 'startDate', date);
  };

  const handleFormatSelect = (format) => {
    handleChange('dataViewer', 'defaultFormat', format);
    setShowFormatModal(false);
    setSelectedFormat(null);
    saveSettings('dataViewer');
  };

  const handleFormatClick = (format) => {
    if (format === 'json') {
      handleFormatSelect(format);
    } else {
      setSelectedFormat(format);
    }
  };

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

  const handleDataTypeSelect = async (dataType) => {
    const format = selectedFormat;
    setDownloadStatus(`Téléchargement ${format} en cours...`);
    setDownloadError('');

    try {
      const response = await api.get(`/api/data/${format}/${dataType}`, {
        responseType: 'blob',
        headers: {
          Accept: getContentType(format),
        },
      });

      const filename = `${dataType}_données.${getFileExtension(format)}`;
      const blob = new Blob([response.data], { type: getContentType(format) });
      saveAs(blob, filename);

      setDownloadStatus(`${format.toUpperCase()} téléchargé avec succès !`);
      setTimeout(() => setDownloadStatus(''), 3000);
      setShowFormatModal(false);
      setSelectedFormat(null);
    } catch (err) {
      setDownloadError(`Erreur lors du téléchargement du fichier ${format} : ${err.message}`);
      setDownloadStatus('');
    }
  };

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" /> Chargement des paramètres...
      </Container>
    );
  }

  return (
    <Container className="settings-container my-4">
      <h2 className="mb-4 d-flex align-items-center">
        <FaClock className="me-2" /> Paramètres de l'application
      </h2>
      {saveStatus.show && (
        <Alert variant={saveStatus.variant} onClose={() => setSaveStatus({ ...saveStatus, show: false })} dismissible>
          {saveStatus.message}
        </Alert>
      )}
      {downloadError && (
        <Alert variant="danger" onClose={() => setDownloadError('')} dismissible>
          {downloadError}
        </Alert>
      )}
      {downloadStatus && (
        <Alert variant="success" onClose={() => setDownloadStatus('')} dismissible>
          <Spinner animation="border" size="sm" className="me-2" />
          {downloadStatus}
        </Alert>
      )}

      <Card className="mb-4 shadow-sm notification-card">
        <Card.Header className="bg-gradient-primary text-white d-flex align-items-center">
          <FaBell className="me-2" /> Notifications
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label className="me-2">Notifications :</Form.Label>
            <Button
              variant={settings.notifications.enable ? 'success' : 'outline-success'}
              className="me-2"
              onClick={async () => {
                handleChange('notifications', 'enable', true);
                try {
                  const res = await api.patch('/api/user-settings/notifications/toggle', { enable: true });
                  if (res.data.success) {
                    setSaveStatus({ show: true, message: res.data.message, variant: 'success' });
                  }
                } catch (error) {
                  setSaveStatus({
                    show: true,
                    message: error.response?.data?.message || "Erreur lors de l'activation des notifications",
                    variant: 'danger',
                  });
                }
              }}
            >
              ✅ Activer
            </Button>

            <Button
              variant={!settings.notifications.enable ? 'danger' : 'outline-danger'}
              onClick={async () => {
                handleChange('notifications', 'enable', false);
                try {
                  const res = await api.patch('/api/user-settings/notifications/toggle', { enable: false });
                  if (res.data.success) {
                    setSaveStatus({ show: true, message: res.data.message, variant: 'success' });
                  }
                } catch (error) {
                  setSaveStatus({
                    show: true,
                    message: error.response?.data?.message || 'Erreur lors de la désactivation des notifications',
                    variant: 'danger',
                  });
                }
              }}
            >
              ❌ Désactiver
            </Button>
          </Form.Group>
        </Card.Body>
      </Card>

      {['admin', 'fueldatamaster', 'fueluser'].includes(userRole) && (
        <Card className="mb-4 shadow-sm scheduler-card">
          <Card.Header className="bg-gradient-primary text-white d-flex align-items-center">
            <FaClock className="me-2" /> Configuration du planificateur
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="scheduler-enabled"
                label="Activer le planificateur"
                checked={settings.schedulerConfig.enabled}
                onChange={toggleScheduler}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Date et heure de début (facultatif)</Form.Label>
              <div className="date-picker-container">
                <DatePicker
                  selected={settings.schedulerConfig.startDate}
                  onChange={handleDateTimeChange}
                  showTimeSelect
                  timeFormat="h:mm aa"
                  timeIntervals={15}
                  dateFormat="yyyy-MM-dd h:mm aa"
                  minDate={new Date()}
                  className="form-control date-picker"
                  placeholderText="Sélectionner une date et une heure"
                />
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="mt-2 clear-date-btn"
                  onClick={() => handleChange('schedulerConfig', 'startDate', null)}
                >
                  Effacer la date et l'heure
                </Button>
              </div>
            </Form.Group>

            <div className="d-flex justify-content-end mt-3">
              <Button variant="primary" onClick={() => saveSettings('schedulerConfig')}>
                <FaSave className="me-2" /> Enregistrer le planificateur
              </Button>
            </div>
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-gradient-primary text-white">Format des données</Card.Header>
        <Card.Body>
          <Form.Group className="mb-3">
            <Form.Label>Format actuel :</Form.Label>
            <div>
              <Button variant="outline-primary" onClick={() => setShowFormatModal(true)}>
                Changer le format
              </Button>
            </div>
          </Form.Group>
        </Card.Body>
      </Card>

      {(userRole === 'admin' || userRole === 'fueldatamaster') && (
        <Card className="mb-4 shadow-sm">
          <Card.Header className="bg-gradient-primary text-white d-flex align-items-center">
            <FaUsers className="me-2" /> Gestion des utilisateurs
          </Card.Header>
          <Card.Body>
            <Button
              variant="primary"
              onClick={() => {
                setShowUsersModal(true);
                fetchUsers();
              }}
            >
              Gérer les comptes utilisateurs
            </Button>
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-gradient-primary text-white d-flex align-items-center">
          <FaUser className="me-2" /> Profil
        </Card.Header>
        <Card.Body>
          <Button variant="primary" onClick={() => setShowProfileModal(true)}>
            Voir mon profil
          </Button>
        </Card.Body>
      </Card>

      <Modal show={showFormatModal} onHide={() => { setShowFormatModal(false); setSelectedFormat(null); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>Sélectionner le format des données</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!selectedFormat ? (
            <div className="d-flex flex-column gap-2">
              {[
                { format: 'json', icon: <FaTable className="me-2" />, label: 'Visualiser' },
                { format: 'excel', icon: <FaFileExcel className="me-2" />, label: 'Excel' },
                { format: 'csv', icon: <FaFileCsv className="me-2" />, label: 'CSV' },
                { format: 'xml', icon: <FaFileCode className="me-2" />, label: 'XML' },
              ].map(({ format, icon, label }) => (
                <Button
                  key={format}
                  variant={settings.dataViewer.defaultFormat === format ? 'primary' : 'outline-primary'}
                  onClick={() => handleFormatClick(format)}
                  className="d-flex align-items-center"
                >
                  {icon}
                  {label}
                </Button>
              ))}
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              <h5>Sélectionner le type de données pour {selectedFormat.toUpperCase()}</h5>
              {[
                { type: 'fuel', label: 'Données Carburant' },
                { type: 'flight', label: 'Données Vol' },
                { type: 'merged', label: 'Données Fusionnées' },
              ].map(({ type, label }) => (
                <Button
                  key={type}
                  variant="outline-secondary"
                  onClick={() => handleDataTypeSelect(type)}
                  className="d-flex align-items-center"
                >
                  {label}
                </Button>
              ))}
              <Button variant="outline-danger" onClick={() => setSelectedFormat(null)} className="mt-2">
                Retour
              </Button>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showUsersModal} onHide={() => setShowUsersModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Gestion des comptes utilisateurs</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Table bordered striped hover responsive>
            <thead>
              <tr>
                <th>Nom d'utilisateur</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.isActive ? '✅ Actif' : '❌ Inactif'}</td>
                  <td>
                    <Button
                      variant={user.isActive ? 'danger' : 'success'}
                      size="sm"
                      onClick={() => toggleAccount(user._id, user.isActive)}
                    >
                      {user.isActive ? 'Désactiver' : 'Activer'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
      </Modal>

      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Mon Profil</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Profile />
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default SettingsPage;