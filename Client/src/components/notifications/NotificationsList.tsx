import React, { useState, useMemo } from 'react';
import { Bell, BellOff, CheckCheck, Trash2 } from 'lucide-react';
import { Notification } from '../../types';
import NotificationCard from './NotificationCard';
import NotificationFilters from './NotificationFilters';

interface NotificationsListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onAcceptRequest: (id: string) => void;
  onDeclineRequest: (id: string) => void;
  onViewTask: (taskId: string) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onAcceptRequest,
  onDeclineRequest,
  onViewTask
}) => {
  const [activeFilter, setActiveFilter] = useState('all');

  // Calculate counts for filters
  const counts = useMemo(() => {
    return {
      all: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      task_request: notifications.filter(n => n.type === 'task_request').length,
      deadline_urgent: notifications.filter(n => n.type === 'deadline_urgent').length,
      task_completed: notifications.filter(n => n.type === 'task_completed').length,
      email_sent: notifications.filter(n => n.type === 'email_sent').length,
    };
  }, [notifications]);

  // Filter notifications based on active filter
  const filteredNotifications = useMemo(() => {
    switch (activeFilter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'task_request':
        return notifications.filter(n => n.type === 'task_request');
      case 'deadline_urgent':
        return notifications.filter(n => n.type === 'deadline_urgent');
      case 'task_completed':
        return notifications.filter(n => n.type === 'task_completed');
      case 'email_sent':
        return notifications.filter(n => n.type === 'email_sent');
      default:
        return notifications;
    }
  }, [notifications, activeFilter]);

  const unreadCount = counts.unread;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Notifications
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <NotificationFilters
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />

      {/* Notifications List */}
      {filteredNotifications.length > 0 ? (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkAsRead={onMarkAsRead}
              onAcceptRequest={onAcceptRequest}
              onDeclineRequest={onDeclineRequest}
              onViewTask={onViewTask}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            {activeFilter === 'unread' ? (
              <BellOff className="w-8 h-8 text-gray-400" />
            ) : (
              <Bell className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {activeFilter === 'unread' ? 'No unread notifications' : 'No notifications found'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {activeFilter === 'unread' 
              ? "You're all caught up! Check back later for new updates."
              : `No ${activeFilter === 'all' ? '' : activeFilter.replace('_', ' ')} notifications to display.`
            }
          </p>
        </div>
      )}
    </div>
  );
};

export default NotificationsList;