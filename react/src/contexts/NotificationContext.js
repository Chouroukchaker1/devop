import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    // Charger les notifications et les paramètres utilisateur au montage du composant
    const fetchData = async () => {
      try {
        // Charger les paramètres utilisateur
        const settingsResponse = await axios.get('/api/userSettings');
        if (settingsResponse.data.success) {
          setNotificationsEnabled(settingsResponse.data.settings.notifications.enable);
        }
        
        // Charger les notifications uniquement si elles sont activées
        if (settingsResponse.data.settings.notifications.enable) {
          const notificationsResponse = await axios.get('/api/notifications');
          setNotifications(notificationsResponse.data);
          setUnreadCount(notificationsResponse.data.filter(n => !n.read).length);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Configurer un rafraîchissement périodique
    const interval = setInterval(() => {
      if (notificationsEnabled) {
        fetchData();
      }
    }, 60000); // Rafraîchir toutes les minutes
    
    return () => clearInterval(interval);
  }, [notificationsEnabled]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
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
      // Correction de la route pour correspondre à celle du backend
      await axios.patch('/api/userSettings/notifications/toggle', {
        enable: enabled
      });
      setNotificationsEnabled(enabled);
      
      // Si on active les notifications, recharger les données
      if (enabled) {
        const response = await axios.get('/api/notifications');
        setNotifications(response.data);
        setUnreadCount(response.data.filter(n => !n.read).length);
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