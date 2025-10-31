const mongoose = require('mongoose');

const passSchema = new mongoose.Schema({
  visitorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visitor',
    required: true
  },
  passNumber: {
    type: String,
    required: true,
    unique: true
  },
  qrCode: {
    type: String,
    required: true // Base64 encoded QR code or URL
  },
  pdfUrl: {
    type: String // URL to generated PDF badge
  },
  issuedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  },
  accessLevel: {
    type: String,
    enum: ['standard', 'vip', 'restricted'],
    default: 'standard'
  },
  validFrom: {
    type: Date,
    required: true
  },
  validTo: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Generate unique pass number before saving
passSchema.pre('save', async function(next) {
  if (!this.passNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.passNumber = `PASS-${timestamp}-${random}`;
  }
  next();
});

module.exports = mongoose.model('Pass', passSchema);
