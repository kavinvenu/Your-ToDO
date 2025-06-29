import React from 'react';
import { Filter, Users, AlertTriangle, CheckCircle, Mail, Clock } from 'lucide-react';

interface NotificationFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  counts: {
    all: number;
    unread: number;
    task_request: number;
    deadline_urgent: number;
    task_completed: number;
    email_sent: number;
  };
}

const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  activeFilter,
  onFilterChange,
  counts
}) => {
  const filters = [
    { key: 'all', label: 'All', icon: Filter, count: counts.all },
    { key: 'unread', label: 'Unread', icon: Clock, count: counts.unread },
    { key: 'task_request', label: 'Task Requests', icon: Users, count: counts.task_request },
    { key: 'deadline_urgent', label: 'Urgent Deadlines', icon: AlertTriangle, count: counts.deadline_urgent },
    { key: 'task_completed', label: 'Completed', icon: CheckCircle, count: counts.task_completed },
    { key: 'email_sent', label: 'Email Notifications', icon: Mail, count: counts.email_sent },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Filter Notifications</h3>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.key}
            onClick={() => onFilterChange(filter.key)}
            className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeFilter === filter.key
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
            }`}
          >
            <filter.icon className="w-4 h-4 mr-2" />
            {filter.label}
            {filter.count > 0 && (
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                activeFilter === filter.key
                  ? 'bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                  : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              }`}>
                {filter.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default NotificationFilters;