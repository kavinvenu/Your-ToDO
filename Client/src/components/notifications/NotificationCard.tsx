import React from 'react';
import { 
  Clock, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Mail, 
  Calendar,
  User,
  Check,
  X,
  ExternalLink
} from 'lucide-react';
import { Notification } from '../../types';
import { formatDate } from '../../utils/dateUtils';

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onAcceptRequest?: (id: string) => void;
  onDeclineRequest?: (id: string) => void;
  onViewTask?: (taskId: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onAcceptRequest,
  onDeclineRequest,
  onViewTask
}) => {
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'task_request':
        return <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'task_shared':
        return <Users className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'deadline_urgent':
        return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'task_completed':
        return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
      case 'task_overdue':
        return <Clock className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'email_sent':
        return <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />;
    }
  };

  const getNotificationBg = (type: Notification['type']) => {
    switch (type) {
      case 'task_request':
        return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
      case 'task_shared':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'deadline_urgent':
      case 'task_overdue':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
      case 'task_completed':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
      case 'email_sent':
        return 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700';
    }
  };

  return (
    <div className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-md ${
      notification.read 
        ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700' 
        : getNotificationBg(notification.type)
    }`}>
      <div className="flex items-start space-x-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-1">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                {notification.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {notification.message}
              </p>

              {/* Metadata */}
              <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>{formatDate(notification.createdAt)}</span>
                </div>

                {notification.fromUser && (
                  <div className="flex items-center space-x-1">
                    <User className="w-3 h-3" />
                    <span>{notification.fromUser.name}</span>
                  </div>
                )}

                {notification.metadata?.priority && (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(notification.metadata.priority)}`}>
                    {notification.metadata.priority} priority
                  </span>
                )}

                {notification.metadata?.dueDate && (
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Due {formatDate(notification.metadata.dueDate)}</span>
                  </div>
                )}
              </div>

              {/* Email Recipients */}
              {notification.metadata?.emailRecipients && notification.metadata.emailRecipients.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Sent to:</p>
                  <div className="flex flex-wrap gap-1">
                    {notification.metadata.emailRecipients.map((email, index) => (
                      <span key={index} className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                        {email}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Read indicator */}
            {!notification.read && (
              <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 mt-3">
            {notification.type === 'task_request' && notification.actionRequired && (
              <>
                <button
                  onClick={() => onAcceptRequest?.(notification.id)}
                  className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Accept
                </button>
                <button
                  onClick={() => onDeclineRequest?.(notification.id)}
                  className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 transition-colors duration-200"
                >
                  <X className="w-3 h-3 mr-1" />
                  Decline
                </button>
              </>
            )}

            {notification.relatedTaskId && (
              <button
                onClick={() => onViewTask?.(notification.relatedTaskId!)}
                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                View Task
              </button>
            )}

            {!notification.read && (
              <button
                onClick={() => onMarkAsRead(notification.id)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
              >
                Mark as read
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard;