import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, Container, NavDropdown, Badge, Spinner } from 'react-bootstrap';
import { FaUser, FaBell, FaSignOutAlt, FaSync, FaEnvelope, FaCog, FaTachometerAlt, FaPlane, FaGasPump, FaDatabase, FaUsers, FaChartLine } from 'react-icons/fa';
import './UserNavbar.css';
import logo from '../assets/logo.png';
import axios from 'axios';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Modal, Button, Input, Select } from 'antd';
const { Option } = Select;

const UserNavbar = ({ handleLogout }) => {
  const [profileImage, setProfileImage] = useState('/default-avatar.png');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isSchedulerRunning, setIsSchedulerRunning] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAdminNotifModal, setShowAdminNotifModal] = useState(false);
  const [notifTargetUsername, setNotifTargetUsername] = useState('');
  const [notifType, setNotifType] = useState('system');
  const [notifMessage, setNotifMessage] = useState('');
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Utilisateur'); // Initialize with localStorage or fallback

  const userRole = localStorage.getItem('userRole');
  const navigate = useNavigate();

  // Notification types synchronized with AdminUsers
  const notificationTypes = [
    { value: 'system', label: 'Système', message: 'Mise à jour du système.' },
    { value: 'update', label: 'Mise à jour', message: 'Votre profil a été mis à jour.' },
    { value: 'data_missing', label: 'Données manquantes', message: 'Veuillez compléter vos informations.', metadata: { missingDetails: ['email', 'profile picture'] } },
    { value: 'alert', label: 'Alerte', message: 'Action requise de votre part.' },
    { value: 'warning', label: 'Avertissement', message: 'Attention, problème détecté.' },
    { value: 'success', label: 'Succès', message: 'Opération effectuée avec succès.' },
    { value: 'importation_data_refusée', label: 'Importation refusée', message: 'Les données importées ont été refusées.' },
    { value: 'erreur', label: 'Erreur', message: 'Une erreur s\'est produite.' },
    { value: 'avertissement_donnée_manquante', label: 'Avertissement données', message: 'Données manquantes détectées.' },
  ];

  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return '/default-avatar.png';
    return imagePath.startsWith('http') 
      ? imagePath 
      : `http://localhost:3000${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setUsername('Utilisateur');
          return;
        }

        const response = await axios.get('http://localhost:3000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.user) {
          // Set username from server response
          const fetchedUsername = response.data.user.username;
          setUsername(fetchedUsername || 'Utilisateur');
          localStorage.setItem('username', fetchedUsername || 'Utilisateur'); // Update localStorage

          // Set profile image
          if (response.data.user.profileImage) {
            const imageUrl = getProfileImageUrl(response.data.user.profileImage);
            setProfileImage(imageUrl);
            localStorage.setItem('profileImage', imageUrl);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données de profil:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('userRole');
          localStorage.removeItem('profileImage');
          navigate('/connexion');
        }
      }
    };

    fetchProfileData();

    const handleStorageChange = () => {
      const storedImage = localStorage.getItem('profileImage');
      if (storedImage) setProfileImage(getProfileImageUrl(storedImage));
      const storedUsername = localStorage.getItem('username');
      if (storedUsername) setUsername(storedUsername);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const response = await axios.get('http://localhost:3000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const fetchedNotifications = response.data.notifications || [];
        
        const sortedNotifications = fetchedNotifications
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setNotifications(sortedNotifications);
        setUnreadCount(sortedNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
  
    const socket = io('http://localhost:3000', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
  
    socket.on('connect', () => {
      console.log('🟢 Connecté au serveur WebSocket avec l\'ID :', socket.id);
    });
  
    socket.on('disconnect', () => {
      console.log('🔴 Déconnecté du WebSocket');
    });
  
    socket.on('notification', (data) => {
      console.log('🔔 Notification reçue :', data);
      const formatted = {
        _id: data._id || Date.now().toString(),
        message: data.message || 'Nouvelle notification',
        type: data.type || 'system',
        read: false,
        createdAt: new Date().toISOString(),
        metadata: data.metadata || {}
      };
  
      setNotifications((prev) => [formatted, ...prev]);
      setUnreadCount((prev) => prev + 1);
      setShowNotifications(true);
  
      toast.info(`🔔 ${formatted.message}`, {
        position: 'top-right',
        autoClose: 4000
      });
    });
  
    return () => {
      socket.disconnect();
    };
  }, []);
  
  const markAsRead = async (id) => {
    try {
      await axios.put(
        `http://localhost:3000/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      await markAsRead(notification._id);
      setShowNotifications(false);
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const triggerScheduler = async () => {
    try {
      setIsSchedulerRunning(true);
      const response = await axios.post(
        `http://localhost:3000/api/trigger-update`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      alert(response.data.message);
    } catch (error) {
      console.error('Erreur lors du déclenchement:', error);
      alert('Échec du déclenchement du scheduler');
    } finally {
      setIsSchedulerRunning(false);
    }
  };

  const getNotificationTitle = (type) => {
    const notification = notificationTypes.find(n => n.value === type);
    return notification ? notification.label : 'Notification';
  };

  return (
    <>
      <Navbar className="navbar" expand="lg" bg="light" variant="light">
        <Container fluid>
          <Navbar.Brand as={Link} to="/">
            <img
              src={logo}
              alt="CarboneTracker Logo"
              width="100"
              height="100"
              className="d-inline-block align-top"
            />
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="navbarNav" />
          <Navbar.Collapse id="navbarNav">
            <Nav className="me-auto">
              {userRole === 'fueldatamaster' && (
                <>
                  <Nav.Link as={Link} to="/dashboard">
                    <FaTachometerAlt className="me-1" /> Tableau de bord
                  </Nav.Link>
                  <Nav.Link as={Link} to="/flight-list">
                    <FaPlane className="me-1" /> Gestion des Vols
                  </Nav.Link>
                  <Nav.Link as={Link} to="/fuel-data">
                    <FaGasPump className="me-1" /> Données Carburant
                  </Nav.Link>
                  <Nav.Link as={Link} to="/extraction-data">
                    <FaDatabase className="me-1" /> Extraction de données
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/users">
                    <FaUsers className="me-1" /> Gestion des utilisateurs
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/contact-messages">
                    <FaEnvelope className="me-1" /> Gestion des réclamations
                  </Nav.Link>
                  <Nav.Link as={Link} to="/App">
                    <FaChartLine className="me-1" /> Prédiction
                  </Nav.Link>
                </>
              )}
              {userRole === 'admin' && (
                <>
                  <Nav.Link as={Link} to="/dashboard">
                    <FaTachometerAlt className="me-1" /> Tableau de bord
                  </Nav.Link>
                  <Nav.Link as={Link} to="/flight-list">
                    <FaPlane className="me-1" /> Gestion des Vols
                  </Nav.Link>
                  <Nav.Link as={Link} to="/fuel-data">
                    <FaGasPump className="me-1" /> Données Carburant
                  </Nav.Link>
                  <Nav.Link as={Link} to="/extraction-data">
                    <FaDatabase className="me-1" /> Extraction de données
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/users">
                    <FaUsers className="me-1" /> Gestion des utilisateurs
                  </Nav.Link>
                  <Nav.Link as={Link} to="/admin/contact-messages">
                    <FaEnvelope className="me-1" /> Gestion des réclamations
                  </Nav.Link>
                  <Nav.Link as={Link} to="/App">
                    <FaChartLine className="me-1" /> Prédiction
                  </Nav.Link>
                </>
              )}
              {userRole === 'fueluser' && (
                <>
                  <Nav.Link as={Link} to="/dashboard">
                    <FaTachometerAlt className="me-1" /> Tableau de bord
                  </Nav.Link>
                  <Nav.Link as={Link} to="/flight-list">
                    <FaPlane className="me-1" /> Gestion des Vols
                  </Nav.Link>
                  <Nav.Link as={Link} to="/fuel-data">
                    <FaGasPump className="me-1" /> Gestion Carburant
                  </Nav.Link>
                  <Nav.Link as={Link} to="/extraction-data">
                    <FaDatabase className="me-1" /> Extraction de données
                  </Nav.Link>
                  <Nav.Link as={Link} to="/App">
                    <FaChartLine className="me-1" /> Prédiction
                  </Nav.Link>
                  <Nav.Link as={Link} to="/contact">
                    <FaEnvelope className="me-1" /> Réclamation
                  </Nav.Link>
                </>
              )}
              {userRole === 'consultant' && (
                <>
                  <Nav.Link as={Link} to="/dashboard">
                    <FaTachometerAlt className="me-1" /> Tableau de bord
                  </Nav.Link>
                  <Nav.Link as={Link} to="/flight-list">
                    <FaPlane className="me-1" /> Consultation des Vols
                  </Nav.Link>
                  <Nav.Link as={Link} to="/fuel-data">
                    <FaGasPump className="me-1" /> Consultation Carburant
                  </Nav.Link>
                  <Nav.Link as={Link} to="/extraction-data">
                    <FaDatabase className="me-1" /> Extraction de données
                  </Nav.Link>
                  <Nav.Link as={Link} to="/contact">
                    <FaEnvelope className="me-1" /> Réclamation
                  </Nav.Link>
                  <Nav.Link as={Link} to="/App">
                    <FaChartLine className="me-1" /> Prédiction
                  </Nav.Link>
                </>
              )}
              {!['fueldatamaster', 'admin', 'fueluser', 'consultant'].includes(userRole) && (
                <Nav.Link as={Link} to="/dashboard">
                  <FaTachometerAlt className="me-1" /> Tableau de bord
                </Nav.Link>
              )}
            </Nav>
            <Nav className="ms-auto align-items-center">
              {userRole && (
                <>
                  <NavDropdown
                    title={
                      <>
                        <FaBell className="nav-icon" />
                        {unreadCount > 0 && (
                          <Badge pill bg="danger" className="notification-badge">
                            {unreadCount}
                          </Badge>
                        )}
                      </>
                    }
                    show={showNotifications}
                    onToggle={(isOpen) => setShowNotifications(isOpen)}
                    align="end"
                    className="notification-dropdown"
                  >
                    <NavDropdown.Header className="d-flex justify-content-between align-items-center">
                      <span>Notifications ({unreadCount} non lues)</span>
                      {(userRole === 'admin' || userRole === 'fueldatamaster') && (
                        <FaEnvelope
                          className="text-primary"
                          style={{ cursor: 'pointer' }}
                          onClick={() => setShowAdminNotifModal(true)}
                          title="Envoyer une notification"
                        />
                      )}
                    </NavDropdown.Header>
                    <NavDropdown.Item
                      className="text-end text-primary"
                      onClick={async () => {
                        try {
                          await Promise.all(
                            notifications.map(n =>
                              n.read ? Promise.resolve() : markAsRead(n._id)
                            )
                          );
                        } catch (err) {
                          console.error('Erreur lors du marquage en masse:', err);
                        }
                      }}
                    >
                      ✅ Marquer tout comme lu
                    </NavDropdown.Item>
                    <div style={{ maxHeight: '400px', overflowY: 'auto', width: '350px' }}>
                      {notifications.length === 0 ? (
                        <NavDropdown.Item disabled>Aucune notification</NavDropdown.Item>
                      ) : (
                        notifications.slice(0, 10).map((item) => (
                          <NavDropdown.Item
                            key={item._id}
                            className={`notification-item ${!item.read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(item)}
                          >
                            <div className="d-flex flex-column">
                              <div className="d-flex justify-content-between align-items-center">
                                <strong>{getNotificationTitle(item.type)}</strong>
                                <small className="text-muted">
                                  {new Date(item.createdAt).toLocaleString('fr-FR', {
                                    dateStyle: 'short',
                                    timeStyle: 'short'
                                  })}
                                </small>
                              </div>
                              <div className="mt-1">{item.message}</div>
                              {(item.type === 'warning' || item.type === 'data_missing' || item.type === 'avertissement_donnée_manquante') && item.metadata?.missingDetails && (
                                <Link
                                  to={`/missing-details/${item._id}`}
                                  className="text-primary mt-1 small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(item._id);
                                  }}
                                >
                                  Voir les détails
                                </Link>
                              )}
                            </div>
                          </NavDropdown.Item>
                        ))
                      )}
                    </div>
                  </NavDropdown>
                  {(userRole === 'fueldatamaster' || userRole === 'admin' || userRole === 'fueluser') && (
                    <NavDropdown
                      title={
                        <div className="d-flex align-items-center">
                          {isSchedulerRunning ? (
                            <Spinner animation="border" size="sm" className="me-2" />
                          ) : (
                            <FaSync className="me-2" />
                          )}
                          <span>Scheduler</span>
                        </div>
                      }
                      id="scheduler-dropdown"
                      align="end"
                    >
                      <NavDropdown.Item onClick={triggerScheduler} disabled={isSchedulerRunning}>
                        {isSchedulerRunning ? 'En cours...' : 'Déclencher maintenant'}
                      </NavDropdown.Item>
                      <NavDropdown.Item as={Link} to="/scheduler-history">
                        Historique
                      </NavDropdown.Item>
                    </NavDropdown>
                  )}
                  <NavDropdown
                    title={
                      <div className="d-flex align-items-center">
                        <img
                          src={profileImage}
                          alt="Profile"
                          className="rounded-circle me-2"
                          style={{
                            width: '30px',
                            height: '30px',
                            objectFit: 'cover',
                            border: '1px solid #ddd'
                          }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/default-avatar.png';
                          }}
                        />
                        <span>Bonjour, {username}</span>
                      </div>
                    }
                    id="profile-dropdown"
                    align="end"
                  >
                    {(userRole === 'admin' || userRole === 'fueldatamaster' || userRole === 'fueluser' || userRole === 'consultant') && (
                      <NavDropdown.Item as={Link} to="/settings">
                        <FaCog className="me-2" /> Paramètres
                      </NavDropdown.Item>
                    )}
                    <NavDropdown.Divider />
                    <NavDropdown.Item onClick={handleLogout}>
                      <FaSignOutAlt className="me-2" /> Déconnexion
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      {showAdminNotifModal && (
        <Modal
          open={true}
          onCancel={() => setShowAdminNotifModal(false)}
          footer={[
            <Button key="cancel" onClick={() => setShowAdminNotifModal(false)}>
              Annuler
            </Button>,
            <Button
              key="send"
              type="primary"
              onClick={async () => {
                try {
                  await axios.post('http://localhost:3000/api/notifications/send', {
                    username: notifTargetUsername,
                    type: notifType,
                    message: notifMessage,
                  }, {
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                  });
                  toast.success("Notification envoyée avec succès !");
                  setShowAdminNotifModal(false);
                  setNotifTargetUsername('');
                  setNotifMessage('');
                  setNotifType('system');
                } catch (err) {
                  console.error("Erreur lors de l'envoi :", err.message);
                  toast.error("Erreur lors de l'envoi de la notification");
                }
              }}
            >
              Envoyer
            </Button>
          ]}
        >
          <div className="mb-3">
            <label>Utilisateur (username)</label>
            <Input
              placeholder="Entrer le nom d'utilisateur"
              value={notifTargetUsername}
              onChange={(e) => setNotifTargetUsername(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label>Type</label>
            <Select
              value={notifType}
              onChange={(value) => setNotifType(value)}
              style={{ width: '100%' }}
            >
              {notificationTypes.map(notification => (
                <Option key={notification.value} value={notification.value}>
                  {notification.label}
                </Option>
              ))}
            </Select>
          </div>
          <div className="mb-3">
            <label>Message</label>
            <Input.TextArea
              rows={3}
              placeholder="Votre message ici"
              value={notifMessage}
              onChange={(e) => setNotifMessage(e.target.value)}
            />
          </div>
        </Modal>
      )}
    </>
  );
};

export default UserNavbar;