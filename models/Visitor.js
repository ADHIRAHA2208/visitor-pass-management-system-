const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String,
    trim: true
  },
  purpose: {
    type: String,
    required: true,
    trim: true
  },
  hostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  photo: {
    type: String // URL to visitor photo
  },
  idProof: {
    type: String // URL to ID proof document
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'checked_in', 'checked_out'],
    default: 'pending'
  },
  expectedArrival: {
    type: Date,
    required: true
  },
  expectedDeparture: {
    type: Date,
    required: true
  },
  actualArrival: {
    type: Date
  },
  actualDeparture: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Visitor', visitorSchema);
