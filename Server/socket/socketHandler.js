const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketHandler = (io) => {
  // Store connected users
  const connectedUsers = new Map();

  // Middleware to authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid or inactive user'));
      }

      socket.userId = user._id.toString();
      socket.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.userId})`);

    // Store connected user
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      connectedAt: new Date()
    });

    // Join user to their personal room
    socket.join(socket.userId);

    // Emit user connected event
    socket.emit('user:connected', {
      userId: socket.userId,
      user: socket.user.getPublicProfile(),
      connectedAt: new Date()
    });

    // Handle task updates
    socket.on('task:update', async (data) => {
      try {
        const { taskId, updates } = data;
        
        // Emit to task owner and shared users
        const task = await require('../models/Task').findById(taskId)
          .populate('owner', 'name email avatar')
          .populate('sharedWith.user', 'name email avatar');

        if (task) {
          // Emit to task owner
          io.to(task.owner._id.toString()).emit('task:updated', { task });
          
          // Emit to shared users
          task.sharedWith.forEach(shared => {
            io.to(shared.user._id.toString()).emit('task:updated', { task });
          });
        }
      } catch (error) {
        console.error('Task update socket error:', error);
        socket.emit('error', { message: 'Failed to update task' });
      }
    });

    // Handle task creation
    socket.on('task:create', async (data) => {
      try {
        const { task } = data;
        
        // Emit to task owner
        io.to(task.owner.toString()).emit('task:created', { task });
      } catch (error) {
        console.error('Task create socket error:', error);
        socket.emit('error', { message: 'Failed to create task' });
      }
    });

    // Handle task deletion
    socket.on('task:delete', async (data) => {
      try {
        const { taskId, sharedUsers } = data;
        
        // Emit to task owner
        io.to(socket.userId).emit('task:deleted', { taskId });
        
        // Emit to shared users
        if (sharedUsers && Array.isArray(sharedUsers)) {
          sharedUsers.forEach(userId => {
            io.to(userId.toString()).emit('task:deleted', { taskId });
          });
        }
      } catch (error) {
        console.error('Task delete socket error:', error);
        socket.emit('error', { message: 'Failed to delete task' });
      }
    });

    // Handle task sharing
    socket.on('task:share', async (data) => {
      try {
        const { task, sharedWithUserId } = data;
        
        // Emit to the user the task was shared with
        io.to(sharedWithUserId.toString()).emit('task:shared', { task });
        
        // Emit to task owner
        io.to(task.owner.toString()).emit('task:shared', { task });
      } catch (error) {
        console.error('Task share socket error:', error);
        socket.emit('error', { message: 'Failed to share task' });
      }
    });

    // Handle task unsharing
    socket.on('task:unshare', async (data) => {
      try {
        const { taskId, unsharedUserId } = data;
        
        // Emit to the user the task was unshared from
        io.to(unsharedUserId.toString()).emit('task:unshared', { taskId });
        
        // Emit to task owner
        io.to(socket.userId).emit('task:unshared', { taskId });
      } catch (error) {
        console.error('Task unshare socket error:', error);
        socket.emit('error', { message: 'Failed to unshare task' });
      }
    });

    // Handle task comments
    socket.on('task:comment', async (data) => {
      try {
        const { task } = data;
        
        // Emit to task owner
        io.to(task.owner.toString()).emit('task:commented', { task });
        
        // Emit to shared users
        task.sharedWith.forEach(shared => {
          io.to(shared.user.toString()).emit('task:commented', { task });
        });
      } catch (error) {
        console.error('Task comment socket error:', error);
        socket.emit('error', { message: 'Failed to add comment' });
      }
    });

    // Handle user typing indicators
    socket.on('typing:start', (data) => {
      const { taskId } = data;
      socket.to(socket.userId).emit('typing:start', {
        taskId,
        userId: socket.userId,
        userName: socket.user.name
      });
    });

    socket.on('typing:stop', (data) => {
      const { taskId } = data;
      socket.to(socket.userId).emit('typing:stop', {
        taskId,
        userId: socket.userId
      });
    });

    // Handle user status updates
    socket.on('user:status', (data) => {
      const { status } = data;
      
      // Update user status in connected users map
      const connectedUser = connectedUsers.get(socket.userId);
      if (connectedUser) {
        connectedUser.status = status;
        connectedUsers.set(socket.userId, connectedUser);
      }

      // Emit to all connected users
      io.emit('user:status_changed', {
        userId: socket.userId,
        userName: socket.user.name,
        status
      });
    });

    // Handle private messages (for future implementation)
    socket.on('message:private', (data) => {
      const { toUserId, message } = data;
      
      // Emit to specific user
      io.to(toUserId).emit('message:private', {
        fromUserId: socket.userId,
        fromUserName: socket.user.name,
        message,
        timestamp: new Date()
      });
    });

    // Handle room joining for collaborative features
    socket.on('room:join', (data) => {
      const { roomId } = data;
      socket.join(roomId);
      socket.emit('room:joined', { roomId });
      
      // Notify other users in the room
      socket.to(roomId).emit('room:user_joined', {
        userId: socket.userId,
        userName: socket.user.name,
        roomId
      });
    });

    socket.on('room:leave', (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      socket.emit('room:left', { roomId });
      
      // Notify other users in the room
      socket.to(roomId).emit('room:user_left', {
        userId: socket.userId,
        userName: socket.user.name,
        roomId
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.userId})`);
      
      // Remove from connected users
      connectedUsers.delete(socket.userId);
      
      // Emit user disconnected event
      io.emit('user:disconnected', {
        userId: socket.userId,
        userName: socket.user.name,
        disconnectedAt: new Date()
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'An error occurred' });
    });
  });

  // Make io available to routes
  io.app = io;

  // Helper function to get connected users
  io.getConnectedUsers = () => {
    return Array.from(connectedUsers.values());
  };

  // Helper function to emit to specific user
  io.emitToUser = (userId, event, data) => {
    const connectedUser = connectedUsers.get(userId);
    if (connectedUser) {
      io.to(connectedUser.socketId).emit(event, data);
    }
  };

  // Helper function to emit to multiple users
  io.emitToUsers = (userIds, event, data) => {
    userIds.forEach(userId => {
      io.emitToUser(userId, event, data);
    });
  };

  // Periodic cleanup of disconnected users
  setInterval(() => {
    const now = new Date();
    for (const [userId, userData] of connectedUsers.entries()) {
      // Remove users who haven't been active for more than 5 minutes
      if (now - userData.connectedAt > 5 * 60 * 1000) {
        connectedUsers.delete(userId);
        console.log(`Cleaned up inactive user: ${userId}`);
      }
    }
  }, 60000); // Run every minute

  console.log('Socket.IO handler initialized');
};

module.exports = socketHandler; 