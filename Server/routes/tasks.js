const express = require('express');
const { body, validationResult, query } = require('express-validator');
const Task = require('../models/Task');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { checkTaskPermission, checkTaskOwnership } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateTask = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title must be between 1 and 200 characters'),
  body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  body('dueDate').isISO8601().withMessage('Due date must be a valid date'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level'),
  body('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  body('category').optional().trim().isLength({ max: 50 }).withMessage('Category cannot exceed 50 characters'),
  body('tags').optional().isArray().withMessage('Tags must be an array'),
  body('estimatedTime').optional().isInt({ min: 0 }).withMessage('Estimated time must be a positive number'),
  body('isRecurring').optional().isBoolean().withMessage('isRecurring must be a boolean'),
  body('recurrence.pattern').optional().isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid recurrence pattern'),
  body('recurrence.interval').optional().isInt({ min: 1 }).withMessage('Recurrence interval must be at least 1')
];

const validateComment = [
  body('content').trim().isLength({ min: 1, max: 500 }).withMessage('Comment must be between 1 and 500 characters')
];

const validateShare = [
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('permission').optional().isIn(['read', 'write', 'admin']).withMessage('Invalid permission level')
];

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// @route   GET /api/tasks
// @desc    Get all tasks for user (owned + shared) with filtering and pagination
// @access  Private
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('status').optional().isIn(['pending', 'in-progress', 'completed', 'cancelled']).withMessage('Invalid status'),
  query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  query('category').optional().trim(),
  query('search').optional().trim(),
  query('sortBy').optional().isIn(['dueDate', 'priority', 'createdAt', 'title']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),
  handleValidationErrors
], async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      search,
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = req.query;

    // Build query
    const query = {
      $or: [
        { owner: userId },
        { 'sharedWith.user': userId }
      ]
    };

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const tasks = await Task.find(query)
      .populate('owner', 'name email avatar')
      .populate('sharedWith.user', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    const total = await Task.countDocuments(query);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    res.json({
      success: true,
      data: {
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          hasNextPage,
          hasPrevPage,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks',
      message: 'An error occurred while fetching tasks'
    });
  }
});

// @route   GET /api/tasks/overdue
// @desc    Get overdue tasks
// @access  Private
router.get('/overdue', async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.getOverdueTasks(userId);
    
    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Get overdue tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch overdue tasks',
      message: 'An error occurred while fetching overdue tasks'
    });
  }
});

// @route   GET /api/tasks/due-today
// @desc    Get tasks due today
// @access  Private
router.get('/due-today', async (req, res) => {
  try {
    const userId = req.user._id;
    const tasks = await Task.getTasksDueToday(userId);
    
    res.json({
      success: true,
      data: { tasks }
    });
  } catch (error) {
    console.error('Get tasks due today error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tasks due today',
      message: 'An error occurred while fetching tasks due today'
    });
  }
});

// @route   GET /api/tasks/stats
// @desc    Get task statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user._id;
    
    const stats = await Task.aggregate([
      {
        $match: {
          $or: [
            { owner: userId },
            { 'sharedWith.user': userId }
          ]
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ['$status', 'completed'] },
                    { $ne: ['$status', 'cancelled'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      overdue: 0
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task statistics',
      message: 'An error occurred while fetching task statistics'
    });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private
router.post('/', validateTask, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user._id;
    const taskData = {
      ...req.body,
      owner: userId
    };

    const task = new Task(taskData);
    await task.save();

    // Add activity log
    await task.addActivity('created', userId, 'Task created');

    // Populate user data
    await task.populate('owner', 'name email avatar');

    // Emit real-time update
    req.app.get('io').to(userId.toString()).emit('task:created', { task });

    // Send notification for task creation
    await Notification.create({
      user: userId,
      type: 'task_created',
      title: 'Task Created',
      message: `You created a new task: "${task.title}"`,
      relatedTaskId: task._id,
      fromUser: {
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar
      }
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create task',
      message: 'An error occurred while creating the task'
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get a specific task
// @access  Private
router.get('/:id', checkTaskPermission('read'), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('owner', 'name email avatar')
      .populate('sharedWith.user', 'name email avatar')
      .populate('comments.user', 'name avatar')
      .populate('activity.user', 'name avatar');

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'The requested task does not exist'
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch task',
      message: 'An error occurred while fetching the task'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private
router.put('/:id', checkTaskPermission('write'), validateTask, handleValidationErrors, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user._id;
    const updates = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'The requested task does not exist'
      });
    }

    // Track what changed for activity log
    const changes = [];
    Object.keys(updates).forEach(key => {
      if (key !== 'owner' && key !== '_id' && task[key] !== updates[key]) {
        changes.push(`${key}: ${task[key]} → ${updates[key]}`);
      }
    });

    // Update the task
    Object.assign(task, updates);
    await task.save();

    // Add activity log
    if (changes.length > 0) {
      await task.addActivity('updated', userId, `Updated: ${changes.join(', ')}`);
    }

    // Populate user data
    await task.populate('owner', 'name email avatar');
    await task.populate('sharedWith.user', 'name email avatar');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(task.owner.toString()).emit('task:updated', { task });
    task.sharedWith.forEach(shared => {
      io.to(shared.user.toString()).emit('task:updated', { task });
    });

    res.json({
      success: true,
      message: 'Task updated successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update task',
      message: 'An error occurred while updating the task'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private
router.delete('/:id', checkTaskOwnership, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'The requested task does not exist'
      });
    }

    // Store shared users for notifications
    const sharedUsers = task.sharedWith.map(shared => shared.user);

    // Delete the task
    await Task.findByIdAndDelete(taskId);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(userId.toString()).emit('task:deleted', { taskId });
    sharedUsers.forEach(userId => {
      io.to(userId.toString()).emit('task:deleted', { taskId });
    });

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete task',
      message: 'An error occurred while deleting the task'
    });
  }
});

// @route   POST /api/tasks/:id/share
// @desc    Share a task with another user
// @access  Private
router.post('/:id/share', checkTaskOwnership, validateShare, handleValidationErrors, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { email, permission = 'read' } = req.body;
    const userId = req.user._id;

    // Find the user to share with
    const userToShare = await User.findOne({ email });
    if (!userToShare) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'No user found with that email address'
      });
    }

    // Check if trying to share with self
    if (userToShare._id.toString() === userId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot share with yourself',
        message: 'You cannot share a task with yourself'
      });
    }

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'The requested task does not exist'
      });
    }

    // Share the task
    await task.shareWithUser(userToShare._id, permission);

    // Add activity log
    await task.addActivity('shared', userId, `Shared with ${userToShare.name} (${permission} permission)`);

    // Add to user's shared tasks
    await userToShare.addSharedTask(taskId, permission);

    // Populate user data
    await task.populate('owner', 'name email avatar');
    await task.populate('sharedWith.user', 'name email avatar');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(userToShare._id.toString()).emit('task:shared', { task });

    res.json({
      success: true,
      message: `Task shared with ${userToShare.name} successfully`,
      data: { task }
    });
  } catch (error) {
    console.error('Share task error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to share task',
      message: 'An error occurred while sharing the task'
    });
  }
});

// @route   DELETE /api/tasks/:id/share/:userId
// @desc    Remove user from shared task
// @access  Private
router.delete('/:id/share/:userId', checkTaskOwnership, async (req, res) => {
  try {
    const { id: taskId, userId: userToRemove } = req.params;
    const currentUserId = req.user._id;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'The requested task does not exist'
      });
    }

    // Remove user from shared list
    await task.removeSharedUser(userToRemove);

    // Remove from user's shared tasks
    const user = await User.findById(userToRemove);
    if (user) {
      await user.removeSharedTask(taskId);
    }

    // Add activity log
    await task.addActivity('shared', currentUserId, `Removed sharing with ${user?.name || 'user'}`);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(userToRemove).emit('task:unshared', { taskId });

    res.json({
      success: true,
      message: 'User removed from shared task successfully'
    });
  } catch (error) {
    console.error('Remove shared user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove user from shared task',
      message: 'An error occurred while removing the user'
    });
  }
});

// @route   POST /api/tasks/:id/comments
// @desc    Add a comment to a task
// @access  Private
router.post('/:id/comments', checkTaskPermission('read'), validateComment, handleValidationErrors, async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user._id;
    const { content } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found',
        message: 'The requested task does not exist'
      });
    }

    // Add comment
    await task.addComment(userId, content);

    // Add activity log
    await task.addActivity('commented', userId, 'Added a comment');

    // Populate user data
    await task.populate('owner', 'name email avatar');
    await task.populate('sharedWith.user', 'name email avatar');
    await task.populate('comments.user', 'name avatar');

    // Emit real-time update
    const io = req.app.get('io');
    io.to(task.owner.toString()).emit('task:commented', { task });
    task.sharedWith.forEach(shared => {
      io.to(shared.user.toString()).emit('task:commented', { task });
    });

    res.json({
      success: true,
      message: 'Comment added successfully',
      data: { task }
    });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
      message: 'An error occurred while adding the comment'
    });
  }
});

module.exports = router;