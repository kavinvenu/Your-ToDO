import { store } from '../store';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  website?: string;
  timezone?: string;
  oauthProvider?: 'local' | 'google' | 'github';
  oauthData?: {
    google?: {
      id: string;
      email: string;
      name: string;
      picture: string;
      verified_email: boolean;
    };
    github?: {
      id: string;
      login: string;
      email: string;
      name: string;
      avatar_url: string;
      bio: string;
      location: string;
      company: string;
      blog: string;
      twitter_username: string;
    };
  };
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    notifications: {
      email: boolean;
      push: boolean;
    };
  };
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  completedAt?: string;
  owner: User;
  sharedWith: Array<{
    user: User;
    permission: 'read' | 'write' | 'admin';
    sharedAt: string;
  }>;
  category?: string;
  estimatedTime?: number;
  actualTime?: number;
  dependencies: string[];
  attachments: Array<{
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: string;
  }>;
  links: Array<{
    title: string;
    url: string;
    description?: string;
  }>;
  activity: Array<{
    action: string;
    user: User;
    details?: string;
    timestamp: string;
  }>;
  comments: Array<{
    id: string;
    user: User;
    content: string;
    createdAt: string;
    updatedAt: string;
  }>;
  isPublic: boolean;
  allowComments: boolean;
  isRecurring: boolean;
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
    nextDueDate?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaskStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  limit: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any[];
}

// Helper function to get auth token
const getAuthToken = (): string | null => store.getState().auth.token;

// Helper function to handle API responses
const handleResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'An error occurred');
  }
  
  return data;
};

// API class
class ApiService {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = getAuthToken();
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    return handleResponse<T>(response);
  }

  // Authentication endpoints
  async register(name: string, email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    return response.data!;
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return response.data!;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me');
    console.log('API.getCurrentUser response:', response);
    return response.data!.user;
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
  }

  async refreshToken(): Promise<{ token: string; user: User }> {
    const response = await this.request<{ token: string; user: User }>('/auth/refresh', {
      method: 'POST',
    });
    return response.data!;
  }

  // Task endpoints
  async getTasks(filters: TaskFilters = {}): Promise<{ tasks: Task[]; pagination: PaginationInfo }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await this.request<{ tasks: Task[]; pagination: PaginationInfo }>(`/tasks?${params}`);
    return response.data!;
  }

  async getTask(id: string): Promise<Task> {
    const response = await this.request<Task>(`/tasks/${id}`);
    return response.data!;
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const response = await this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
    return response.data!;
  }

  async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
    const response = await this.request<Task>(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
    return response.data!;
  }

  async deleteTask(id: string): Promise<void> {
    await this.request(`/tasks/${id}`, { method: 'DELETE' });
  }

  async getOverdueTasks(): Promise<Task[]> {
    const response = await this.request<Task[]>('/tasks/overdue');
    return response.data!;
  }

  async getTasksDueToday(): Promise<Task[]> {
    const response = await this.request<Task[]>('/tasks/due-today');
    return response.data!;
  }

  async getTaskStats(): Promise<TaskStats> {
    const response = await this.request<TaskStats>('/tasks/stats');
    return response.data!;
  }

  async shareTask(taskId: string, email: string, permission: 'read' | 'write' | 'admin' = 'read'): Promise<Task> {
    const response = await this.request<Task>(`/tasks/${taskId}/share`, {
      method: 'POST',
      body: JSON.stringify({ email, permission }),
    });
    return response.data!;
  }

  async removeSharedUser(taskId: string, userId: string): Promise<void> {
    await this.request(`/tasks/${taskId}/share/${userId}`, { method: 'DELETE' });
  }

  async addComment(taskId: string, content: string): Promise<Task> {
    const response = await this.request<Task>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return response.data!;
  }

  // User endpoints
  async getUserProfile(): Promise<User> {
    const response = await this.request<User>('/users/profile');
    return response.data!;
  }

  async updateUserProfile(profileData: Partial<User>): Promise<User> {
    const response = await this.request<{ user: User }>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.data!.user;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.request('/users/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const response = await this.request<User[]>(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data!;
  }

  async getSharedTasks(page: number = 1, limit: number = 10): Promise<{ sharedTasks: any[]; pagination: PaginationInfo }> {
    const response = await this.request<{ sharedTasks: any[]; pagination: PaginationInfo }>(`/users/shared-tasks?page=${page}&limit=${limit}`);
    return response.data!;
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.request<User>(`/users/${id}`);
    return response.data!;
  }

  async deleteAccount(): Promise<void> {
    await this.request('/users/account', { method: 'DELETE' });
  }

  // Health check
  async healthCheck(): Promise<any> {
    const response = await this.request('/health');
    return response.data;
  }
}

// Create and export API instance
export const api = new ApiService(API_BASE_URL);

// Export OAuth URLs
export const OAUTH_URLS = {
  google: `${API_BASE_URL}/auth/google`,
  github: `${API_BASE_URL}/auth/github`,
};

// Helper function to handle OAuth callback
export const handleOAuthCallback = (): { token: string; user: User } | null => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token) {
    // Remove token from URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Decode and return user data (you might want to verify the token with the backend)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        token,
        user: {
          id: payload.userId,
          name: payload.name || 'User',
          email: payload.email || '',
          avatar: payload.avatar || '',
        } as User,
      };
    } catch (error) {
      console.error('Error parsing OAuth token:', error);
      return null;
    }
  }
  
  return null;
};