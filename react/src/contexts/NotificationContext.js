import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Charger les paramètres utilisateur avec Authorization
        const settingsResponse = await axios.get('http://localhost:8082/api/user-settings', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (settingsResponse.data.success) {
          setNotificationsEnabled(settingsResponse.data.settings.notifications.enable);
        }

        // Charger les notifications si activées
        if (settingsResponse.data.settings.notifications.enable) {
          const notificationsResponse = await axios.get('http://localhost:8082/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          });

          const data = notificationsResponse.data.notifications || [];
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.read).length);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications data:', error);
        setLoading(false);
      }
    };

    fetchData();

    const interval = setInterval(() => {
      if (notificationsEnabled) {
        fetchData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:8082/api/notifications/${id}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const toggleNotifications = async (enabled) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        'http://localhost:8082/api/user-settings/notifications/toggle',
        { enable: enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNotificationsEnabled(enabled);

      if (enabled) {
        const response = await axios.get('http://localhost:8082/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = response.data.notifications || [];
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Error toggling notifications:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      notificationsEnabled,
      markAsRead,
      toggleNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
