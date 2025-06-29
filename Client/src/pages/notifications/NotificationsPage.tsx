import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/common/Layout';
import NotificationsList from '../../components/notifications/NotificationsList';
import { useNotifications } from '../../hooks/useNotifications';
import { useToast } from '../../hooks/useToast';

const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    acceptRequest,
    declineRequest,
  } = useNotifications();

  const handleAcceptRequest = (id: string) => {
    acceptRequest(id);
    addToast({
      type: 'success',
      message: 'Collaboration request accepted successfully!'
    });
  };

  const handleDeclineRequest = (id: string) => {
    declineRequest(id);
    addToast({
      type: 'info',
      message: 'Collaboration request declined.'
    });
  };

  const handleViewTask = (taskId: string) => {
    // Navigate to dashboard with task focus
    navigate(`/dashboard?task=${taskId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading notifications...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <NotificationsList
            notifications={notifications}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onDeleteNotification={deleteNotification}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
            onViewTask={handleViewTask}
          />
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsPage;