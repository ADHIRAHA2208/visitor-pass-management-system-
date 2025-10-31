const CheckLog = require('../models/CheckLog');
const Pass = require('../models/Pass');
const Visitor = require('../models/Visitor');
const { verifyQRToken } = require('../utils/qrGenerator');

// @desc    Check-in visitor
// @route   POST /api/checklogs/checkin
// @access  Private (Admin/Security)
const checkInVisitor = async (req, res) => {
  try {
    const { qrData, location, temperature, notes } = req.body;

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
    const pass = await Pass.findById(parsedData.passId);
    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    // Verify pass is valid
    if (pass.status !== 'active') {
      return res.status(400).json({ message: `Pass is ${pass.status}` });
    }

    // Check expiration
    if (new Date() > pass.expiresAt) {
      pass.status = 'expired';
      await pass.save();
      return res.status(400).json({ message: 'Pass has expired' });
    }

    // Find visitor
    const visitor = await Visitor.findById(pass.visitorId);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Check if visitor is already checked in
    const existingCheckIn = await CheckLog.findOne({
      visitorId: visitor._id,
      type: 'check_in',
      $or: [
        { timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }, // Last 24 hours
        { type: 'check_out', timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
      ]
    }).sort({ timestamp: -1 });

    if (existingCheckIn && existingCheckIn.type === 'check_in') {
      return res.status(400).json({ message: 'Visitor is already checked in' });
    }

    // Create check-in log
    const checkLog = new CheckLog({
      visitorId: visitor._id,
      passId: pass._id,
      type: 'check_in',
      location,
      checkedBy: req.user._id,
      temperature,
      notes,
      method: 'qr_scan'
    });

    await checkLog.save();

    // Update visitor status
    visitor.status = 'checked_in';
    visitor.actualArrival = new Date();
    await visitor.save();

    // Populate check log data
    await checkLog.populate([
      { path: 'visitorId', select: 'name email phone company' },
      { path: 'passId', select: 'passNumber' },
      { path: 'checkedBy', select: 'name' }
    ]);

    res.status(201).json({
      message: 'Visitor checked in successfully',
      checkLog,
      visitor
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Check-out visitor
// @route   POST /api/checklogs/checkout
// @access  Private (Admin/Security)
const checkOutVisitor = async (req, res) => {
  try {
    const { qrData, location, notes } = req.body;

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
    const pass = await Pass.findById(parsedData.passId);
    if (!pass) {
      return res.status(404).json({ message: 'Pass not found' });
    }

    // Find visitor
    const visitor = await Visitor.findById(pass.visitorId);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Check if visitor is checked in
    if (visitor.status !== 'checked_in') {
      return res.status(400).json({ message: 'Visitor is not checked in' });
    }

    // Create check-out log
    const checkLog = new CheckLog({
      visitorId: visitor._id,
      passId: pass._id,
      type: 'check_out',
      location,
      checkedBy: req.user._id,
      notes,
      method: 'qr_scan'
    });

    await checkLog.save();

    // Update visitor status
    visitor.status = 'checked_out';
    visitor.actualDeparture = new Date();
    await visitor.save();

    // Populate check log data
    await checkLog.populate([
      { path: 'visitorId', select: 'name email phone company' },
      { path: 'passId', select: 'passNumber' },
      { path: 'checkedBy', select: 'name' }
    ]);

    res.status(201).json({
      message: 'Visitor checked out successfully',
      checkLog,
      visitor
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get check logs
// @route   GET /api/checklogs
// @access  Private
const getCheckLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      visitorId,
      type,
      startDate,
      endDate,
      search
    } = req.query;

    let query = {};

    // Filter by visitor
    if (visitorId) {
      query.visitorId = visitorId;
    }

    // Filter by type
    if (type) {
      query.type = type;
    }

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    // Search by visitor name or pass number
    if (search) {
      // This would require more complex aggregation, simplified for now
    }

    // Permission-based filtering
    if (req.user.role === 'employee') {
      const visitorIds = await Visitor.find({ hostId: req.user._id }).distinct('_id');
      query.visitorId = { $in: visitorIds };
    }

    const checkLogs = await CheckLog.find(query)
      .populate('visitorId', 'name email phone company')
      .populate('passId', 'passNumber')
      .populate('checkedBy', 'name')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ timestamp: -1 });

    const total = await CheckLog.countDocuments(query);

    res.json({
      checkLogs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get check logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get check log by ID
// @route   GET /api/checklogs/:id
// @access  Private
const getCheckLogById = async (req, res) => {
  try {
    const checkLog = await CheckLog.findById(req.params.id)
      .populate('visitorId', 'name email phone company purpose')
      .populate('passId', 'passNumber validFrom validTo')
      .populate('checkedBy', 'name email');

    if (!checkLog) {
      return res.status(404).json({ message: 'Check log not found' });
    }

    // Check permissions
    if (req.user.role === 'employee') {
      const visitor = await Visitor.findById(checkLog.visitorId._id);
      if (visitor.hostId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json({ checkLog });
  } catch (error) {
    console.error('Get check log by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get visitor check history
// @route   GET /api/checklogs/visitor/:visitorId
// @access  Private
const getVisitorCheckHistory = async (req, res) => {
  try {
    const { visitorId } = req.params;

    // Check permissions
    if (req.user.role === 'employee') {
      const visitor = await Visitor.findById(visitorId);
      if (!visitor || visitor.hostId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const checkLogs = await CheckLog.find({ visitorId })
      .populate('passId', 'passNumber')
      .populate('checkedBy', 'name')
      .sort({ timestamp: -1 });

    res.json({ checkLogs });
  } catch (error) {
    console.error('Get visitor check history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get check logs statistics
// @route   GET /api/checklogs/stats
// @access  Private (Admin/Security)
const getCheckLogStats = async (req, res) => {
  try {
    const { period = 'today' } = req.query;

    let startDate;
    const now = new Date();

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const stats = await CheckLog.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalCheckIns = stats.find(s => s._id === 'check_in')?.count || 0;
    const totalCheckOuts = stats.find(s => s._id === 'check_out')?.count || 0;

    // Get current checked-in visitors
    const currentCheckedIn = await Visitor.countDocuments({
      status: 'checked_in',
      actualArrival: { $gte: startDate }
    });

    res.json({
      period,
      totalCheckIns,
      totalCheckOuts,
      currentCheckedIn,
      checkInOutRatio: totalCheckOuts > 0 ? (totalCheckIns / totalCheckOuts).toFixed(2) : 'N/A'
    });
  } catch (error) {
    console.error('Get check log stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  checkInVisitor,
  checkOutVisitor,
  getCheckLogs,
  getCheckLogById,
  getVisitorCheckHistory,
  getCheckLogStats
};
