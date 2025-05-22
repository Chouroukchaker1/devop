// context/NotificationContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { api } from '../services/api'; // ✅ corrige ton import ici

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!user || !token) return;

    // ✅ Connexion WebSocket AVEC le token JWT
    const newSocket = io('http://localhost:8080', {
      path: '/socket.io',
      transports: ['websocket'],
      auth: { token }, // Le token JWT est passé ici
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setSocket(newSocket);

    // ✅ Gérer les événements
    newSocket.on('connect', () => {
      console.log('🟢 WebSocket connecté avec ID :', newSocket.id);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Erreur WebSocket :', err.message);
    });

    newSocket.on('notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // ✅ Affichage local via Notification API
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title || 'Nouvelle notification', {
          body: notification.message || '',
        });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, token]);

  useEffect(() => {
    if (!token) return;

    const fetchNotifications = async () => {
      try {
        const response = await api.get('/notifications');
        const data = response.data.notifications || [];
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.read).length);
      } catch (err) {
        console.error('Erreur chargement notifications :', err);
      }
    };

    fetchNotifications();

    // Demander permission browser
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }
  }, [token]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur marquage notification :', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
