import React, { useState } from 'react';
import { Calendar, Clock, Tag, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { Task } from '../../services/api';
import { formatDistanceToNow } from '../../utils/dateUtils';

interface TaskCardProps {
  task: Task;
  onUpdate: (id: string, updates: Partial<Task>) => Promise<Task>;
  onDelete: (id: string) => Promise<void>;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onUpdate, onDelete }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 border-green-200';
      case 'in-progress': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'pending': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'cancelled': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const handleStatusChange = async (newStatus: Task['status']) => {
    setIsUpdating(true);
    try {
      await onUpdate(task.id, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: Task['priority']) => {
    setIsUpdating(true);
    try {
      await onUpdate(task.id, { priority: newPriority });
    } catch (error) {
      console.error('Failed to update task priority:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const isOverdue = () => {
    if (task.status === 'completed' || task.status === 'cancelled') return false;
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    return dueDate < now;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2">
              {task.title}
            </h3>
            {isOverdue() && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Overdue
              </span>
            )}
          </div>
          
          {task.description && (
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">
              {task.description}
            </p>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-gray-500" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <div className="py-1">
                <button
                  onClick={() => {
                    // Open edit modal or set editing state
                    if (typeof window !== 'undefined' && window.dispatchEvent) {
                      window.dispatchEvent(new CustomEvent('edit-task', { detail: { task } }));
                    }
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Task
                </button>
                <button
                  onClick={() => {
                    onDelete(task.id);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Task
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status and Priority */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={task.status}
          onChange={(e) => handleStatusChange(e.target.value as Task['status'])}
          disabled={isUpdating}
          className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)} disabled:opacity-50`}
        >
          <option value="pending">Pending</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={task.priority}
          onChange={(e) => handlePriorityChange(e.target.value as Task['priority'])}
          disabled={isUpdating}
          className={`px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(task.priority)} disabled:opacity-50`}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Task Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="w-4 h-4 mr-2" />
          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          {task.completedAt && (
            <span className="ml-2">
              • Completed: {new Date(task.completedAt).toLocaleDateString()}
            </span>
          )}
        </div>

        {task.category && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Tag className="w-4 h-4 mr-2" />
            <span>{task.category}</span>
          </div>
        )}

        {task.estimatedTime && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-2" />
            <span>Estimated: {task.estimatedTime}h</span>
            {task.actualTime && (
              <span className="ml-2">• Actual: {task.actualTime}h</span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Created {formatDistanceToNow(task.createdAt)} ago</span>
        <span>Updated {formatDistanceToNow(task.updatedAt)} ago</span>
      </div>
    </div>
  );
};

export default TaskCard;