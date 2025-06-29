const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  actionRequired: { type: Boolean, default: false },
  relatedTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
  fromUser: {
    name: String,
    email: String,
    avatar: String
  },
  metadata: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);
