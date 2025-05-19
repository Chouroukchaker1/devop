// context/NotificationContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (user) {
      // Connecter le socket
      const newSocket = io(process.env.REACT_APP_API_URL, {
        withCredentials: true
      });
      setSocket(newSocket);

      // S'abonner aux notifications
      newSocket.emit('subscribeToNotifications', user._id);

      // Écouter les nouvelles notifications
      newSocket.on('newNotification', (notification) => {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Afficher une notification toast
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message
          });
        }
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      // Charger les notifications initiales
      const fetchNotifications = async () => {
        try {
          const response = await api.get('/notifications');
          setNotifications(response.data.notifications);
          
          // Compter les non lues
          const count = response.data.notifications.filter(n => !n.read).length;
          setUnreadCount(count);
        } catch (error) {
          console.error('Error fetching notifications:', error);
        }
      };
      
      fetchNotifications();
      
      // Demander la permission pour les notifications
      if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission();
      }
    }
  }, [user]);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => prev - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <NotificationContext.Provider 
      value={{ notifications, unreadCount, markAsRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);