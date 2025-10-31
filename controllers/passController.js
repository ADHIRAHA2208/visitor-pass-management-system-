const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const User = require('../models/User');
const { generatePassQR } = require('../utils/qrGenerator');
const { generateVisitorPassPDF } = require('../utils/pdfGenerator');

// @desc    Issue visitor pass
// @route   POST /api/passes
// @access  Private (Admin/Security)
const issuePass = async (req, res) => {
  try {
    const {
      visitorId,
      validFrom,
      validTo,
      accessLevel
    } = req.body;

    // Verify visitor exists and is approved
    const visitor = await Visitor.findById(visitorId).populate('hostId', 'name email department');
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    if (visitor.status !== 'approved') {
      return res.status(400).json({ message: 'Visitor must be approved before issuing pass' });
    }

    // Check if pass already exists for this visitor
    const existingPass = await Pass.findOne({
      visitorId,
      status: { $in: ['active', 'expired'] }
    });

    if (existingPass) {
      return res.status(400).json({ message: 'Active pass already exists for this visitor' });
    }

    // Generate QR code
    const passData = {
      _id: null, // Will be set after creation
      visitorId,
      passNumber: '', // Will be generated
      issuedAt: new Date(),
      expiresAt: new Date(validTo)
    };

    const { qrCode, token } = await generatePassQR(passData);

    // Create pass
    const pass = new Pass({
      visitorId,
      qrCode,
      issuedBy: req.user._id,
      expiresAt: new Date(validTo),
      validFrom: new Date(validFrom),
      validTo: new Date(validTo),
      accessLevel: accessLevel || 'standard'
    });

    await pass.save();

    // Update passData with actual ID and pass number for QR
    passData._id = pass._id;
    passData.passNumber = pass.passNumber;

    // Generate PDF
    const pdfBuffer = await generateVisitorPassPDF(pass, visitor, visitor.hostId);

    // Save PDF URL (in a real app, you'd upload to cloud storage)
    const pdfFileName = `pass-${pass.passNumber}.pdf`;
    const pdfUrl = `/pdfs/${pdfFileName}`;

    // Update pass with PDF URL
    pass.pdfUrl = pdfUrl;
    await pass.save();

    // Populate visitor and issuer data
    await pass.populate([
      { path: 'visitorId', select: 'name email phone company purpose' },
      { path: 'issuedBy', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Pass issued successfully',
      pass,
      pdfBuffer // In production, return PDF URL instead
    });
  } catch (error) {
    console.error('Issue pass error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all passes
// @route   GET /api/passes
// @access  Private
const getPasses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      visitorId,
      search
    } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by visitor
    if (visitorId) {
      query.visitorId = visitorId;
    }

    // Search by pass number
    if (search) {
      query.passNumber = { $regex: search, $options: 'i' };
    }

    // Permission-based filtering
    if (req.user.role === 'employee') {
      // Employees can only see passes for their visitors
      const visitorIds = await Visitor.find({ hostId: req.user._id }).distinct('_id');
      query.visitorId = { $in: visitorIds };
    }

    const passes = await Pass.find(query)
      .populate('visitorId', 'name email phone company')
      .populate('issuedBy', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ issuedAt: -1 });

    const total = await Pass.countDocuments(query);

    res.json({
      passes,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get passes error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get pass by ID
// @route   GET /api/passes/:id
// @access  Private
const getPassById = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id)
      .populate('visitorId', 'name email phone company purpose photo')
      .populate('issuedBy', 'name email');

    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    // Check permissions
    if (req.user.role === 'employee') {
      const visitor = await Visitor.findById(pass.visitorId._id);
      if (visitor.hostId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ pass });
  } catch (error) {
    console.error('Get pass by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Revoke pass
// @route   PUT /api/passes/:id/revoke
// @access  Private (Admin/Security)
const revokePass = async (req, res) => {
  try {
    const pass = await Pass.findById(req.params.id);

    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    if (pass.status === 'revoked') {
      return res.status(400).json({ message: 'Pass is already revoked' });
    }

    pass.status = 'revoked';
    await pass.save();

    await pass.populate([
      { path: 'visitorId', select: 'name email phone company' },
      { path: 'issuedBy', select: 'name email' }
    ]);

    res.json({
      message: 'Pass revoked successfully',
      pass
    });
  } catch (error) {
    console.error('Revoke pass error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Verify pass QR code
// @route   POST /api/passes/verify
// @access  Private (Admin/Security)
const verifyPass = async (req, res) => {
  try {
    const { qrData } = req.body;

    if (!qrData) {
      return res.status(400).json({ message: 'QR data is required' });
    }

    // Parse QR data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (error) {
      return res.status(400).json({ message: 'Invalid QR code data' });
    }

    // Find pass
    const pass = await Pass.findById(parsedData.passId)
      .populate('visitorId', 'name email phone company status');

    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    // Check if pass is active
    if (pass.status !== 'active') {
      return res.status(400).json({
        message: `Pass is ${pass.status}`,
        pass
      });
    }

    // Check expiration
    if (new Date() > pass.expiresAt) {
      pass.status = 'expired';
      await pass.save();
      return res.status(400).json({
        message: 'Pass has expired',
        pass
      });
    }

    // Check visitor status
    if (pass.visitorId.status !== 'approved') {
      return res.status(400).json({
        message: 'Visitor is not approved',
        pass
      });
    }

    res.json({
      message: 'Pass is valid',
      pass,
      visitor: pass.visitorId
    });
  } catch (error) {
    console.error('Verify pass error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  issuePass,
  getPasses,
  getPassById,
  revokePass,
  verifyPass
};
