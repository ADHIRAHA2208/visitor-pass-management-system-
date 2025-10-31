const Visitor = require('../models/Visitor');
const User = require('../models/User');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// @desc    Create visitor registration
// @route   POST /api/visitors
// @access  Private
const createVisitor = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      company,
      purpose,
      hostId,
      expectedArrival,
      expectedDeparture,
      notes
    } = req.body;

    // Check if host exists and is an employee
    const host = await User.findById(hostId);
    if (!host || !['employee', 'admin'].includes(host.role)) {
      return res.status(400).json({ message: 'Invalid host selected' });
    }

    const visitor = new Visitor({
      name,
      email,
      phone,
      company,
      purpose,
      hostId,
      expectedArrival: new Date(expectedArrival),
      expectedDeparture: new Date(expectedDeparture),
      notes
    });

    await visitor.save();

    // Populate host information
    await visitor.populate('hostId', 'name email department');

    res.status(201).json({
      message: 'Visitor registered successfully',
      visitor
    });
  } catch (error) {
    console.error('Create visitor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all visitors
// @route   GET /api/visitors
// @access  Private
const getVisitors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      hostId,
      search,
      startDate,
      endDate
    } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by host (for employees) or show all (for admin/security)
    if (req.user.role === 'employee') {
      query.hostId = req.user._id;
    } else if (hostId) {
      query.hostId = hostId;
    }

    // Search by name, email, or company
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.expectedArrival = {};
      if (startDate) query.expectedArrival.$gte = new Date(startDate);
      if (endDate) query.expectedArrival.$lte = new Date(endDate);
    }

    const visitors = await Visitor.find(query)
      .populate('hostId', 'name email department')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Visitor.countDocuments(query);

    res.json({
      visitors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get visitors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get visitor by ID
// @route   GET /api/visitors/:id
// @access  Private
const getVisitorById = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('hostId', 'name email department phone');

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Check if user has permission to view this visitor
    if (req.user.role === 'employee' && visitor.hostId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ visitor });
  } catch (error) {
    console.error('Get visitor by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update visitor
// @route   PUT /api/visitors/:id
// @access  Private
const updateVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Check permissions
    if (req.user.role === 'employee' && visitor.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowedFields = [
      'name', 'email', 'phone', 'company', 'purpose',
      'expectedArrival', 'expectedDeparture', 'notes'
    ];

    // Only admin/security can update status
    if (['admin', 'security'].includes(req.user.role)) {
      allowedFields.push('status');
    }

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field.includes('Arrival') || field.includes('Departure')) {
          visitor[field] = new Date(req.body[field]);
        } else {
          visitor[field] = req.body[field];
        }
      }
    });

    await visitor.save();
    await visitor.populate('hostId', 'name email department');

    res.json({
      message: 'Visitor updated successfully',
      visitor
    });
  } catch (error) {
    console.error('Update visitor error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Upload visitor photo
// @route   POST /api/visitors/:id/photo
// @access  Private
const uploadPhoto = [
  upload.single('photo'),
  async (req, res) => {
    try {
      const visitor = await Visitor.findById(req.params.id);

      if (!visitor) {
        return res.status(404).json({ message: 'Visitor not found' });
      }

      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      visitor.photo = `/uploads/${req.file.filename}`;
      await visitor.save();

      res.json({
        message: 'Photo uploaded successfully',
        photoUrl: visitor.photo
      });
    } catch (error) {
      console.error('Upload photo error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
];

// @desc    Approve/Reject visitor
// @route   PUT /api/visitors/:id/status
// @access  Private (Admin/Security/Host)
const updateVisitorStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['approved', 'rejected'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const visitor = await Visitor.findById(req.params.id);

    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Check permissions
    const canApprove = ['admin', 'security'].includes(req.user.role) ||
                      (req.user.role === 'employee' && visitor.hostId.toString() === req.user._id.toString());

    if (!canApprove) {
      return res.status(403).json({ message: 'Access denied' });
    }

    visitor.status = status;
    await visitor.save();
    await visitor.populate('hostId', 'name email department');

    res.json({
      message: `Visitor ${status} successfully`,
      visitor
    });
  } catch (error) {
    console.error('Update visitor status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createVisitor,
  getVisitors,
  getVisitorById,
  updateVisitor,
  uploadPhoto,
  updateVisitorStatus
};
