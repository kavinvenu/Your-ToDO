import { useState, useEffect, useCallback } from 'react';
import { api, Task, TaskFilters, TaskStats, PaginationInfo } from '../services/api';
import { socketService } from '../services/socket';

interface UseTasksReturn {
  tasks: Task[];
  stats: TaskStats | null;
  pagination: PaginationInfo | null;
  isLoading: boolean;
  error: string | null;
  filters: TaskFilters;
  setFilters: (filters: TaskFilters) => void;
  createTask: (taskData: Partial<Task>) => Promise<Task>;
  updateTask: (id: string, taskData: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  shareTask: (taskId: string, email: string, permission?: 'read' | 'write' | 'admin') => Promise<Task>;
  removeSharedUser: (taskId: string, userId: string) => Promise<void>;
  addComment: (taskId: string, content: string) => Promise<Task>;
  getOverdueTasks: () => Promise<Task[]>;
  getTasksDueToday: () => Promise<Task[]>;
  refreshTasks: () => Promise<void>;
  clearError: () => void;
}

export const useTasks = (initialFilters: TaskFilters = {}): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(initialFilters);

  // Helper to normalize id and ensure date fields are strings
  const normalizeTask = (task: any) => ({
    ...task,
    id: task.id || task._id,
    dueDate: typeof task.dueDate === 'string' ? task.dueDate : new Date(task.dueDate).toISOString(),
    createdAt: typeof task.createdAt === 'string' ? task.createdAt : new Date(task.createdAt).toISOString(),
    updatedAt: typeof task.updatedAt === 'string' ? task.updatedAt : new Date(task.updatedAt).toISOString(),
    completedAt: task.completedAt ? (typeof task.completedAt === 'string' ? task.completedAt : new Date(task.completedAt).toISOString()) : undefined,
  });

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { tasks: fetchedTasks, pagination: paginationInfo } = await api.getTasks(filters);
      setTasks(fetchedTasks.map(normalizeTask));
      setPagination(paginationInfo);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await api.getTaskStats();
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [fetchTasks, fetchStats]);

  // Socket.IO real-time updates
  useEffect(() => {
    // Connect to socket service
    socketService.connect();

    // Listen for task updates
    const handleTaskCreated = (newTask: Task) => {
      setTasks(prev => [normalizeTask(newTask), ...prev]);
      fetchStats();
    };

    const handleTaskUpdated = (updatedTask: Task) => {
      setTasks(prev => prev.map(task => (task.id === (updatedTask.id || updatedTask._id) ? normalizeTask(updatedTask) : task)));
      fetchStats();
    };

    const handleTaskDeleted = (taskId: string) => {
      setTasks(prev => prev.filter(task => task.id !== taskId && task._id !== taskId));
      fetchStats();
    };

    const handleTaskShared = (updatedTask: Task) => {
      setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
    };

    const handleTaskCommentAdded = (updatedTask: Task) => {
      setTasks(prev => prev.map(task => task.id === updatedTask.id ? updatedTask : task));
    };

    // Subscribe to socket events
    socketService.onTaskCreated(handleTaskCreated);
    socketService.onTaskUpdated(handleTaskUpdated);
    socketService.onTaskDeleted(handleTaskDeleted);
    socketService.onTaskShared(handleTaskShared);
    socketService.onTaskCommentAdded(handleTaskCommentAdded);

    // Cleanup function
    return () => {
      socketService.off('task:created', handleTaskCreated);
      socketService.off('task:updated', handleTaskUpdated);
      socketService.off('task:deleted', handleTaskDeleted);
      socketService.off('task:shared', handleTaskShared);
      socketService.off('task:comment_added', handleTaskCommentAdded);
    };
  }, [fetchStats]);

  const createTask = async (taskData: Partial<Task>): Promise<Task> => {
    setError(null);
    // Optimistically add the task to the UI
    const tempId = `temp-${Date.now()}`;
    const optimisticTask = normalizeTask({ ...taskData, id: tempId, status: taskData.status || 'pending', priority: taskData.priority || 'medium', dueDate: taskData.dueDate || new Date().toISOString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setTasks(prev => [optimisticTask, ...prev]);
    try {
      const newTask = await api.createTask(taskData);
      setTasks(prev => [normalizeTask(newTask), ...prev.filter(task => task.id !== tempId)]);
      fetchStats();
      return normalizeTask(newTask);
    } catch (error) {
      setTasks(prev => prev.filter(task => task.id !== tempId));
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      setError(errorMessage);
      throw error;
    }
  };

  const updateTask = async (id: string, taskData: Partial<Task>): Promise<Task> => {
    setError(null);
    // Optimistically update the task in the UI
    setTasks(prev => prev.map(task => task.id === id ? normalizeTask({ ...task, ...taskData, updatedAt: new Date().toISOString() }) : task));
    try {
      const updatedTask = await api.updateTask(id, taskData);
      setTasks(prev => prev.map(task => task.id === (updatedTask.id || updatedTask._id) ? normalizeTask(updatedTask) : task));
      fetchStats();
      return normalizeTask(updatedTask);
    } catch (error) {
      // Optionally, you could refetch tasks here if you want to revert
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      setError(errorMessage);
      throw error;
    }
  };

  const deleteTask = async (id: string): Promise<void> => {
    setError(null);
    // Optimistically remove the task from the UI
    const prevTasks = tasks;
    setTasks(prev => prev.filter(task => task.id !== id && task._id !== id));
    try {
      await api.deleteTask(id);
      fetchStats();
    } catch (error) {
      setTasks(prevTasks); // revert
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      setError(errorMessage);
      throw error;
    }
  };

  const shareTask = async (taskId: string, email: string, permission: 'read' | 'write' | 'admin' = 'read'): Promise<Task> => {
    setError(null);
    
    try {
      const updatedTask = await api.shareTask(taskId, email, permission);
      // Socket will handle the real-time update
      return updatedTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to share task';
      setError(errorMessage);
      throw error;
    }
  };

  const removeSharedUser = async (taskId: string, userId: string): Promise<void> => {
    setError(null);
    
    try {
      await api.removeSharedUser(taskId, userId);
      // Refresh the specific task to get updated shared users
      const updatedTask = await api.getTask(taskId);
      setTasks(prev => prev.map(task => task.id === taskId ? updatedTask : task));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove shared user';
      setError(errorMessage);
      throw error;
    }
  };

  const addComment = async (taskId: string, content: string): Promise<Task> => {
    setError(null);
    
    try {
      const updatedTask = await api.addComment(taskId, content);
      // Socket will handle the real-time update
      return updatedTask;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add comment';
      setError(errorMessage);
      throw error;
    }
  };

  const getOverdueTasks = async (): Promise<Task[]> => {
    try {
      return await api.getOverdueTasks();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch overdue tasks';
      setError(errorMessage);
      throw error;
    }
  };

  const getTasksDueToday = async (): Promise<Task[]> => {
    try {
      return await api.getTasksDueToday();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch today\'s tasks';
      setError(errorMessage);
      throw error;
    }
  };

  const refreshTasks = async (): Promise<void> => {
    await fetchTasks();
    await fetchStats();
  };

  const clearError = () => {
    setError(null);
  };

  return {
    tasks,
    stats,
    pagination,
    isLoading,
    error,
    filters,
    setFilters,
    createTask,
    updateTask,
    deleteTask,
    shareTask,
    removeSharedUser,
    addComment,
    getOverdueTasks,
    getTasksDueToday,
    refreshTasks,
    clearError,
  };
};