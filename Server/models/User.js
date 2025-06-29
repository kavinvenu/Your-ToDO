const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  avatar: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  // OAuth fields
  googleId: {
    type: String,
    sparse: true
  },
  githubId: {
    type: String,
    sparse: true
  },
  // OAuth provider information
  oauthProvider: {
    type: String,
    enum: ['local', 'google', 'github'],
    default: 'local'
  },
  oauthData: {
    google: {
      type: Object,
      default: undefined
    },
    github: {
      type: Object,
      default: undefined
    }
  },
  // Profile fields
  bio: {
    type: String,
    maxlength: [200, 'Bio cannot be more than 200 characters']
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot be more than 100 characters']
  },
  website: {
    type: String,
    maxlength: [200, 'Website URL cannot be more than 200 characters']
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    },
    notifications: {
      email: {
        type: Boolean,
        default: true
      },
      push: {
        type: Boolean,
        default: true
      }
    }
  },
  // Task sharing and collaboration
  sharedTasks: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
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
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ githubId: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to get public profile (without sensitive data)
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    bio: this.bio,
    location: this.location,
    website: this.website,
    timezone: this.timezone,
    oauthProvider: this.oauthProvider,
    oauthData: this.oauthData,
    preferences: this.preferences,
    isActive: this.isActive,
    isVerified: this.isVerified,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

// Static method to find by OAuth ID
userSchema.statics.findByOAuthId = function(provider, id) {
  const field = `${provider}Id`;
  return this.findOne({ [field]: id });
};

// Method to add shared task
userSchema.methods.addSharedTask = function(taskId, permission = 'read') {
  const existingIndex = this.sharedTasks.findIndex(
    shared => shared.taskId.toString() === taskId.toString()
  );
  
  if (existingIndex >= 0) {
    this.sharedTasks[existingIndex].permission = permission;
    this.sharedTasks[existingIndex].sharedAt = new Date();
  } else {
    this.sharedTasks.push({ taskId, permission });
  }
  
  return this.save();
};

// Method to remove shared task
userSchema.methods.removeSharedTask = function(taskId) {
  this.sharedTasks = this.sharedTasks.filter(
    shared => shared.taskId.toString() !== taskId.toString()
  );
  return this.save();
};

// Method to check task permission
userSchema.methods.hasTaskPermission = function(taskId, requiredPermission = 'read') {
  const sharedTask = this.sharedTasks.find(
    shared => shared.taskId.toString() === taskId.toString()
  );
  
  if (!sharedTask) return false;
  
  const permissions = { read: 1, write: 2, admin: 3 };
  return permissions[sharedTask.permission] >= permissions[requiredPermission];
};

module.exports = mongoose.model('User', userSchema); 