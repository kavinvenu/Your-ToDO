const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access token required',
        message: 'Please provide a valid authentication token'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user and attach to request
    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({ 
        error: 'Account deactivated',
        message: 'Your account has been deactivated'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'The provided token is invalid'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please login again'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication'
    });
  }
};

// Middleware to check if user is task owner or has admin permission
const checkTaskPermission = (requiredPermission = 'read') => {
  return async (req, res, next) => {
    try {
      const { id, taskId } = req.params;
      const userId = req.user._id;
      // Use id or taskId for compatibility with different routes
      const taskIdToFind = id || taskId;
      // Find the task
      const Task = require('../models/Task');
      const task = await Task.findById(taskIdToFind);
      if (!task) {
        return res.status(404).json({ 
          error: 'Task not found',
          message: 'The requested task does not exist'
        });
      }
      // Check if user has permission
      const hasPermission = task.userHasPermission(userId, requiredPermission);
      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Permission denied',
          message: `You don't have ${requiredPermission} permission for this task`
        });
      }
      req.task = task;
      next();
    } catch (error) {
      console.error('Task permission check error:', error);
      return res.status(500).json({ 
        error: 'Permission check error',
        message: 'An error occurred while checking permissions'
      });
    }
  };
};

// Middleware to check if user is task owner
const checkTaskOwnership = async (req, res, next) => {
  try {
    const { id, taskId } = req.params;
    const userId = req.user._id;
    const taskIdToFind = id || taskId;
    const Task = require('../models/Task');
    const task = await Task.findById(taskIdToFind);
    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found',
        message: 'The requested task does not exist'
      });
    }
    if (task.owner.toString() !== userId.toString()) {
      return res.status(403).json({ 
        error: 'Permission denied',
        message: 'Only the task owner can perform this action'
      });
    }
    req.task = task;
    next();
  } catch (error) {
    console.error('Task ownership check error:', error);
    return res.status(500).json({ 
      error: 'Ownership check error',
      message: 'An error occurred while checking ownership'
    });
  }
};

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      if (user && user.isActive) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication if token is invalid
    next();
  }
};

module.exports = {
  authenticateToken,
  checkTaskPermission,
  checkTaskOwnership,
  generateToken,
  optionalAuth
};