import { useState, useEffect, useCallback } from 'react';
import { Notification } from '../types';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Load notifications from backend API on mount
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/users/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (data.success && data.data && data.data.notifications) {
          setNotifications(data.data.notifications);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id ? { ...notification, read: true } : notification
    ));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  }, []);

  const deleteNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const acceptRequest = useCallback((id: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id 
        ? { ...notification, read: true, actionRequired: false, message: notification.message + ' - Request accepted' }
        : notification
    ));
  }, []);

  const declineRequest = useCallback((id: string) => {
    setNotifications(prev => prev.map(notification =>
      notification.id === id 
        ? { ...notification, read: true, actionRequired: false, message: notification.message + ' - Request declined' }
        : notification
    ));
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    return newNotification;
  }, []);

  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications: notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    loading,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    acceptRequest,
    declineRequest,
    addNotification,
  };
};