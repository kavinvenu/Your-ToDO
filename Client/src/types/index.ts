export interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface TaskFilter {
  status?: Task['status'][];
  priority?: Task['priority'][];
  dueDate?: 'today' | 'overdue' | 'this-week' | 'all';
  search?: string;
  sharedOnly?: boolean;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export interface Notification {
  id: string;
  type: 'task_request' | 'task_shared' | 'deadline_urgent' | 'task_completed' | 'task_overdue' | 'email_sent';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionRequired?: boolean;
  relatedTaskId?: string;
  fromUser?: {
    name: string;
    email: string;
    avatar?: string;
  };
  metadata?: {
    taskTitle?: string;
    dueDate?: string;
    priority?: Task['priority'];
    emailRecipients?: string[];
  };
}