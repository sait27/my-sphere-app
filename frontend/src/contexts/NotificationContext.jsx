import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/axiosConfig';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [alerts, setAlerts] = useState([]);

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/subscriptions/alerts/unread/');
      setUnreadCount(response.data.length);
      setAlerts(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const markAsRead = async (alertId) => {
    try {
      await apiClient.post(`/subscriptions/alerts/${alertId}/mark_read/`);
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const dismissAlert = async (alertId) => {
    try {
      await apiClient.post(`/subscriptions/alerts/${alertId}/dismiss/`);
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 5 minutes
    const interval = setInterval(fetchUnreadCount, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <NotificationContext.Provider value={{
      unreadCount,
      alerts,
      fetchUnreadCount,
      markAsRead,
      dismissAlert
    }}>
      {children}
    </NotificationContext.Provider>
  );
};