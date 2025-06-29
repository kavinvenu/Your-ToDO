import { io, Socket } from 'socket.io-client';
import { Task, User } from './api';
import { store } from '../store';

// Move this to the top before any usage
const getAuthToken = (): string | null => store.getState().auth.token;

export interface SocketEvents {
  // Task events
  'task:created': (task: Task) => void;
  'task:updated': (task: Task) => void;
  'task:deleted': (taskId: string) => void;
  'task:shared': (task: Task) => void;
  'task:comment_added': (task: Task) => void;
  
  // User events
  'user:online': (user: User) => void;
  'user:offline': (userId: string) => void;
  
  // Notification events
  'notification:new': (notification: any) => void;
  
  // General events
  'connect': () => void;
  'disconnect': (reason: string) => void;
  'error': (error: any) => void;
}

class SocketService {
  private socket: Socket | null = null;
  private eventListeners: Map<string, Set<Function>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    const token = getAuthToken();
    if (!token) {
      console.warn('No authentication token found for socket connection');
      return;
    }

    this.socket = io((import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '')) || 'http://localhost:5000', {
      auth: {
        token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.reconnectAttempts = 0;
      this.emit('user:online');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.emit('user:offline');
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`);
      this.reconnectAttempts = attemptNumber;
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });

    // Task events
    this.socket.on('task:created', (task: Task) => {
      this.notifyListeners('task:created', task);
    });

    this.socket.on('task:updated', (task: Task) => {
      this.notifyListeners('task:updated', task);
    });

    this.socket.on('task:deleted', (taskId: string) => {
      this.notifyListeners('task:deleted', taskId);
    });

    this.socket.on('task:shared', (task: Task) => {
      this.notifyListeners('task:shared', task);
    });

    this.socket.on('task:comment_added', (task: Task) => {
      this.notifyListeners('task:comment_added', task);
    });

    // User events
    this.socket.on('user:online', (user: User) => {
      this.notifyListeners('user:online', user);
    });

    this.socket.on('user:offline', (userId: string) => {
      this.notifyListeners('user:offline', userId);
    });

    // Notification events
    this.socket.on('notification:new', (notification: any) => {
      this.notifyListeners('notification:new', notification);
    });
  }

  public connect() {
    if (!this.socket) {
      this.initializeSocket();
    } else if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  public disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  public emit(event: string, data?: any) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn(`Cannot emit ${event}: socket not connected`);
    }
  }

  public on<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback as Function);
  }

  public off<T extends keyof SocketEvents>(event: T, callback: SocketEvents[T]) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback as Function);
    }
  }

  private notifyListeners(event: string, data?: any) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in socket event listener for ${event}:`, error);
        }
      });
    }
  }

  public isConnected(): boolean {
    return this.socket?.connected || false;
  }

  public getSocketId(): string | undefined {
    return this.socket?.id;
  }

  // Task-specific methods
  public joinTaskRoom(taskId: string) {
    this.emit('join:task', { taskId });
  }

  public leaveTaskRoom(taskId: string) {
    this.emit('leave:task', { taskId });
  }

  public joinUserRoom() {
    this.emit('join:user');
  }

  public leaveUserRoom() {
    this.emit('leave:user');
  }

  // Typed event listeners for better TypeScript support
  public onTaskCreated(callback: (task: Task) => void) {
    this.on('task:created', callback);
  }

  public onTaskUpdated(callback: (task: Task) => void) {
    this.on('task:updated', callback);
  }

  public onTaskDeleted(callback: (taskId: string) => void) {
    this.on('task:deleted', callback);
  }

  public onTaskShared(callback: (task: Task) => void) {
    this.on('task:shared', callback);
  }

  public onTaskCommentAdded(callback: (task: Task) => void) {
    this.on('task:comment_added', callback);
  }

  public onUserOnline(callback: (user: User) => void) {
    this.on('user:online', callback);
  }

  public onUserOffline(callback: (userId: string) => void) {
    this.on('user:offline', callback);
  }

  public onNotificationNew(callback: (notification: any) => void) {
    this.on('notification:new', callback);
  }

  public onConnect(callback: () => void) {
    this.on('connect', callback);
  }

  public onDisconnect(callback: (reason: string) => void) {
    this.on('disconnect', callback);
  }

  public onError(callback: (error: any) => void) {
    this.on('error', callback);
  }
}

// Create and export singleton instance
export const socketService = new SocketService();

// Export the class for testing purposes
export { SocketService };