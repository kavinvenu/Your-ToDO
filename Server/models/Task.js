const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [200, 'Title cannot be more than 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot be more than 1000 characters']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  completedAt: {
    type: Date
  },
  // Task ownership and sharing
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'read'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Task categorization
  category: {
    type: String,
    trim: true,
    maxlength: [50, 'Category cannot be more than 50 characters']
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot be more than 30 characters']
  }],
  // Task details
  estimatedTime: {
    type: Number, // in minutes
    min: [0, 'Estimated time cannot be negative']
  },
  actualTime: {
    type: Number, // in minutes
    min: [0, 'Actual time cannot be negative']
  },
  // Task dependencies
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  // Task attachments and links
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  links: [{
    title: String,
    url: String,
    description: String
  }],
  // Task activity and history
  activity: [{
    action: {
      type: String,
      enum: ['created', 'updated', 'status_changed', 'shared', 'commented', 'deleted']
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    details: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // Task comments
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: [500, 'Comment cannot be more than 500 characters']
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Task settings
  isPublic: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  // Recurring tasks
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurrence: {
    pattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      default: 1
    },
    endDate: Date,
    nextDueDate: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
taskSchema.index({ owner: 1, status: 1 });
taskSchema.index({ owner: 1, dueDate: 1 });
taskSchema.index({ 'sharedWith.user': 1 });
taskSchema.index({ status: 1, dueDate: 1 });
taskSchema.index({ priority: 1, dueDate: 1 });
taskSchema.index({ tags: 1 });
taskSchema.index({ category: 1 });

// Virtual for overdue status
taskSchema.virtual('isOverdue').get(function() {
  if (this.status === 'completed' || this.status === 'cancelled') {
    return false;
  }
  return new Date() > this.dueDate;
});

// Virtual for days until due
taskSchema.virtual('daysUntilDue').get(function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Pre-save middleware to update completedAt
taskSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  } else if (this.isModified('status') && this.status !== 'completed') {
    this.completedAt = undefined;
  }
  next();
});

// Method to add activity log
taskSchema.methods.addActivity = function(action, userId, details = '') {
  this.activity.push({
    action,
    user: userId,
    details,
    timestamp: new Date()
  });
  return this.save();
};

// Method to add comment
taskSchema.methods.addComment = function(userId, content) {
  this.comments.push({
    user: userId,
    content,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  return this.save();
};

// Method to share task with user
taskSchema.methods.shareWithUser = function(userId, permission = 'read') {
  const existingIndex = this.sharedWith.findIndex(
    shared => shared.user.toString() === userId.toString()
  );
  
  if (existingIndex >= 0) {
    this.sharedWith[existingIndex].permission = permission;
    this.sharedWith[existingIndex].sharedAt = new Date();
  } else {
    this.sharedWith.push({
      user: userId,
      permission,
      sharedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to remove user from shared list
taskSchema.methods.removeSharedUser = function(userId) {
  this.sharedWith = this.sharedWith.filter(
    shared => shared.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method to check if user has permission
taskSchema.methods.userHasPermission = function(userId, requiredPermission = 'read') {
  if (this.owner.toString() === userId.toString()) {
    return true; // Owner has all permissions
  }
  
  const shared = this.sharedWith.find(
    shared => shared.user.toString() === userId.toString()
  );
  
  if (!shared) return false;
  
  const permissions = { read: 1, write: 2, admin: 3 };
  return permissions[shared.permission] >= permissions[requiredPermission];
};

// Static method to get tasks for user (owned + shared)
taskSchema.statics.getTasksForUser = function(userId, filters = {}) {
  const query = {
    $or: [
      { owner: userId },
      { 'sharedWith.user': userId }
    ]
  };
  
  // Apply filters
  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.category) query.category = filters.category;
  if (filters.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags };
  }
  
  return this.find(query)
    .populate('owner', 'name email avatar')
    .populate('sharedWith.user', 'name email avatar')
    .populate('comments.user', 'name avatar')
    .sort({ dueDate: 1, priority: -1 });
};

// Static method to get overdue tasks
taskSchema.statics.getOverdueTasks = function(userId) {
  return this.find({
    $or: [
      { owner: userId },
      { 'sharedWith.user': userId }
    ],
    status: { $nin: ['completed', 'cancelled'] },
    dueDate: { $lt: new Date() }
  }).populate('owner', 'name email avatar');
};

// Static method to get tasks due today
taskSchema.statics.getTasksDueToday = function(userId) {
  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  return this.find({
    $or: [
      { owner: userId },
      { 'sharedWith.user': userId }
    ],
    status: { $nin: ['completed', 'cancelled'] },
    dueDate: { $gte: startOfDay, $lt: endOfDay }
  }).populate('owner', 'name email avatar');
};

module.exports = mongoose.model('Task', taskSchema); 