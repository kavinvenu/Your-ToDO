const express = require('express');
const { body, validationResult, query } = require('express-validator');
const User = require('../models/User');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const upload = require('../middleware/avatarUpload');
const path = require('path');

const router = express.Router();

// Validation middleware
const validateProfileUpdate = [
  body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
  body('bio').optional().trim().isLength({ max: 200 }).withMessage('Bio cannot exceed 200 characters'),
  body('location').optional().trim().isLength({ max: 100 }).withMessage('Location cannot exceed 100 characters'),
  body('website').optional().trim().isURL().withMessage('Please provide a valid website URL'),
  body('timezone').optional().trim(),
  body('preferences.theme').optional().isIn(['light', 'dark', 'auto']).withMessage('Invalid theme preference'),
  body('preferences.notifications.email').optional().isBoolean().withMessage('Email notifications must be boolean'),
  body('preferences.notifications.push').optional().isBoolean().withMessage('Push notifications must be boolean')
];

const validatePasswordChange = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
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

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
      message: 'An error occurred while fetching your profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', validateProfileUpdate, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user._id;
    const updates = req.body;

    console.log('🔍 Profile update request:', {
      userId,
      updates,
      userOAuthProvider: req.user.oauthProvider
    });

    // Remove sensitive fields that shouldn't be updated via this route
    delete updates.password;
    delete updates.googleId;
    delete updates.githubId;
    delete updates.oauthProvider;
    delete updates.oauthData;

    // For OAuth users, don't allow email changes
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    if (user.oauthProvider !== 'local' && updates.email) {
      console.log('🔍 Removing email update for OAuth user');
      delete updates.email;
    }

    console.log('🔍 Final updates to apply:', updates);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    console.log('🔍 Updated user:', {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      bio: updatedUser.bio,
      location: updatedUser.location,
      website: updatedUser.website
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
      message: 'An error occurred while updating your profile'
    });
  }
});

// @route   PUT /api/users/password
// @desc    Change user password
// @access  Private
router.put('/password', validatePasswordChange, handleValidationErrors, async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    // Find user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Check if user has a password (OAuth users might not have one)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        error: 'No password set',
        message: 'This account was created with OAuth and does not have a password'
      });
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid password',
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password',
      message: 'An error occurred while changing your password'
    });
  }
});

// @route   GET /api/users/search
// @desc    Search users by email or username for task sharing
// @access  Private
router.get('/search', [
  query('q').trim().isLength({ min: 1 }).withMessage('Search query is required'),
  query('limit').optional().isInt({ min: 1, max: 20 }).withMessage('Limit must be between 1 and 20'),
  handleValidationErrors
], async (req, res) => {
  try {
    const userId = req.user._id;
    const { q, limit = 10 } = req.query;

    // Search for users by email or name
    const users = await User.find({
      $and: [
        {
          $or: [
            { email: { $regex: q, $options: 'i' } },
            { name: { $regex: q, $options: 'i' } }
          ]
        },
        { _id: { $ne: userId } }, // Exclude current user
        { isActive: true } // Only active users
      ]
    })
    .select('name email avatar bio')
    .limit(parseInt(limit))
    .lean();

    res.json({
      success: true,
      data: { users }
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search users',
      message: 'An error occurred while searching for users'
    });
  }
});

// @route   GET /api/users/shared-tasks
// @desc    Get tasks shared with current user
// @access  Private
router.get('/shared-tasks', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  handleValidationErrors
], async (req, res) => {
  try {
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    // Get user's shared tasks
    const user = await User.findById(userId).populate({
      path: 'sharedTasks.taskId',
      populate: [
        { path: 'owner', select: 'name email avatar' },
        { path: 'sharedWith.user', select: 'name email avatar' }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    // Paginate shared tasks
    const skip = (page - 1) * limit;
    const sharedTasks = user.sharedTasks
      .filter(shared => shared.taskId) // Filter out deleted tasks
      .slice(skip, skip + parseInt(limit));

    const total = user.sharedTasks.filter(shared => shared.taskId).length;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        sharedTasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get shared tasks error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch shared tasks',
      message: 'An error occurred while fetching shared tasks'
    });
  }
});

// @route   GET /api/users/notifications
// @desc    Get user notifications from DB
// @access  Private
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();
    res.json({
      success: true,
      data: {
        notifications,
        unreadCount: notifications.filter(n => !n.read).length
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notifications',
      message: 'An error occurred while fetching notifications'
    });
  }
});

// @route   POST /api/users/avatar
// @desc    Upload and update user avatar
// @access  Private
router.post('/avatar', upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        message: 'Please upload an image file.'
      });
    }
    // Build the avatar URL (assuming server runs at localhost:5000)
    const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;
    // Update user
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: avatarUrl },
      { new: true }
    ).select('avatar');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }
    res.json({
      success: true,
      avatarUrl
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload avatar',
      message: 'An error occurred while uploading avatar.'
    });
  }
});

// @route   GET /api/users/:id
// @desc    Get public profile of another user
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const currentUserId = req.user._id;

    // Don't allow users to view their own profile via this route
    if (userId === currentUserId.toString()) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Use /profile route to view your own profile'
      });
    }

    const user = await User.findById(userId)
      .select('name email avatar bio isActive')
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      message: 'An error occurred while fetching user information'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all tasks owned by the user
    const ownedTasks = await Task.find({ owner: userId });
    const taskIds = ownedTasks.map(task => task._id);

    // Remove user from all shared tasks
    await Task.updateMany(
      { 'sharedWith.user': userId },
      { $pull: { sharedWith: { user: userId } } }
    );

    // Remove shared tasks from user's list
    await User.updateMany(
      { 'sharedTasks.taskId': { $in: taskIds } },
      { $pull: { sharedTasks: { taskId: { $in: taskIds } } } }
    );

    // Delete all tasks owned by the user
    await Task.deleteMany({ owner: userId });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account',
      message: 'An error occurred while deleting your account'
    });
  }
});

module.exports = router;