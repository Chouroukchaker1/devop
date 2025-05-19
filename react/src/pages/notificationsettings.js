import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Row, Col, Button } from 'react-bootstrap';
import { FaSave, FaBell, FaSync, FaDatabase, FaEnvelope } from 'react-icons/fa';
import { useNotifications } from '../contexts/NotificationContext';

const api = axios.create({
  baseURL: 'http://localhost:3000', // Adjust to your backend port
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const NotificationSettings = ({ settings, setSettings, saveSettings, saveStatus, setSaveStatus }) => {
  const { notificationsEnabled, toggleNotifications } = useNotifications();

  const handleChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value
      }
    }));
  };

  const handleToggleNotifications = async () => {
    try {
      const newEnableState = !notificationsEnabled;
      const response = await api.patch('/api/user-settings/notifications/toggle', { enable: newEnableState });

      if (response.data.success) {
        setSettings((prev) => ({
          ...prev,
          notifications: { ...prev.notifications, enable: newEnableState }
        }));
        toggleNotifications(newEnableState);
        setSaveStatus({
          show: true,
          message: newEnableState ? 'Notifications activées' : 'Notifications désactivées',
          variant: 'success'
        });
        setTimeout(() => setSaveStatus((prev) => ({ ...prev, show: false })), 3000);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error.response?.data || error.message);
      setSaveStatus({
        show: true,
        message: error.response?.data?.message || 'Erreur lors de la mise à jour des notifications',
        variant: 'danger'
      });
    }
  };

  return (
    <Row>
      <Col md={6}>
        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="enable-notifications"
            label="Activer les notifications"
            checked={notificationsEnabled}
            onChange={handleToggleNotifications}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="notification-sound"
            label="Son des notifications"
            checked={settings.notifications.sound}
            onChange={(e) => handleChange('sound', e.target.checked)}
            disabled={!notificationsEnabled}
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            label={<><FaSync className="me-2" />Notifications de mise à jour</>}
            checked={settings.notifications.updateNotifications}
            onChange={(e) => handleChange('updateNotifications', e.target.checked)}
            disabled={!notificationsEnabled}
          />
          <Form.Text className="text-muted">
            Recevoir des notifications pour les nouvelles versions et mises à jour de sécurité
          </Form.Text>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            label={<><FaDatabase className="me-2" />Alertes données manquantes</>}
            checked={settings.notifications.missingDataNotifications}
            onChange={(e) => handleChange('missingDataNotifications', e.target.checked)}
            disabled={!notificationsEnabled}
          />
          <Form.Text className="text-muted">
            Recevoir des alertes lorsque des données sont manquantes ou incomplètes
          </Form.Text>
        </Form.Group>
      </Col>

      <Col md={6}>
        {settings.notifications.missingDataNotifications && (
          <Form.Group className="mb-3">
            <Form.Label>Seuil d'alerte données manquantes (jours)</Form.Label>
            <Form.Control
              type="number"
              min="1"
              max="30"
              value={settings.notifications.missingDataThreshold}
              onChange={(e) => handleChange('missingDataThreshold', parseInt(e.target.value, 10) || 1)}
              disabled={!notificationsEnabled}
            />
            <Form.Text className="text-muted">
              Nombre de jours avant envoi d'une alerte pour données manquantes
            </Form.Text>
          </Form.Group>
        )}

        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="quiet-hours"
            label="Heures de silence"
            checked={settings.notifications.quietHours}
            onChange={(e) => handleChange('quietHours', e.target.checked)}
            disabled={!notificationsEnabled}
          />
        </Form.Group>

        {settings.notifications.quietHours && (
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Début</Form.Label>
                <Form.Control
                  type="time"
                  value={settings.notifications.quietStart}
                  onChange={(e) => handleChange('quietStart', e.target.value)}
                  disabled={!notificationsEnabled}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Fin</Form.Label>
                <Form.Control
                  type="time"
                  value={settings.notifications.quietEnd}
                  onChange={(e) => handleChange('quietEnd', e.target.value)}
                  disabled={!notificationsEnabled}
                />
              </Form.Group>
            </Col>
          </Row>
        )}

        <Form.Group className="mb-3">
          <Form.Check
            type="switch"
            id="email-alerts"
            label={<><FaEnvelope className="me-2" />Alertes par email</>}
            checked={settings.notifications.emailAlerts}
            onChange={(e) => handleChange('emailAlerts', e.target.checked)}
            disabled={!notificationsEnabled}
          />
        </Form.Group>

        {settings.notifications.emailAlerts && (
          <Form.Group className="mb-3">
            <Form.Label>Adresse email</Form.Label>
            <Form.Control
              type="email"
              placeholder="votre@email.com"
              value={settings.notifications.emailAddress}
              onChange={(e) => handleChange('emailAddress', e.target.value)}
              disabled={!notificationsEnabled}
            />
          </Form.Group>
        )}
      </Col>

      <div className="d-flex justify-content-end">
        <Button
          variant="primary"
          onClick={() => saveSettings('notifications')}
          disabled={!notificationsEnabled}
        >
          <FaSave className="me-2" />Sauvegarder
        </Button>
      </div>
    </Row>
  );
};

export default NotificationSettings;