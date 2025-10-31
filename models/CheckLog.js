const mongoose = require('mongoose');

const checkLogSchema = new mongoose.Schema({
  visitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
    required: true
  },
  passId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pass'
  },
  type: {
    type: String,
    enum: ['check_in', 'check_out'],
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    trim: true
  },
  checkedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  method: {
    type: String,
    enum: ['qr_scan', 'manual', 'facial_recognition'],
    default: 'qr_scan'
  },
  notes: {
    type: String,
    trim: true
  },
  temperature: {
    type: Number, // Optional temperature reading
    min: 30,
    max: 45
  },
  deviceInfo: {
    type: String, // Information about the scanning device
    trim: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
checkLogSchema.index({ visitorId: 1, timestamp: -1 });
checkLogSchema.index({ type: 1, timestamp: -1 });

module.exports = mongoose.model('CheckLog', checkLogSchema);
