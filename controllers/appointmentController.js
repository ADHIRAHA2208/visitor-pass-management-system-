const Appointment = require('../models/Appointment');
const Visitor = require('../models/Visitor');
const User = require('../models/User');

// @desc    Create appointment
// @route   POST /api/appointments
// @access  Private
const createAppointment = async (req, res) => {
  try {
    const {
      visitorId,
      title,
      description,
      date,
      startTime,
      endTime,
      location,
      attendees,
      notes
    } = req.body;

    // Verify visitor exists and user has permission
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Only host or admin can create appointments for a visitor
    if (req.user.role !== 'admin' && visitor.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const appointment = new Appointment({
      visitorId,
      hostId: req.user._id,
      title,
      description,
      date: new Date(date),
      startTime,
      endTime,
      location,
      attendees: attendees || [],
      notes
    });

    await appointment.save();

    // Populate related data
    await appointment.populate([
      { path: 'visitorId', select: 'name email phone company' },
      { path: 'hostId', select: 'name email department' },
      { path: 'attendees', select: 'name email' }
    ]);

    res.status(201).json({
      message: 'Appointment created successfully',
      appointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all appointments
// @route   GET /api/appointments
// @access  Private
const getAppointments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      visitorId,
      date,
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

    // Filter by date
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      query.date = { $gte: startOfDay, $lte: endOfDay };
    }

    // Search by title or description
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Permission-based filtering
    if (req.user.role === 'employee') {
      query.$or = [
        { hostId: req.user._id },
        { attendees: req.user._id }
      ];
    }

    const appointments = await Appointment.find(query)
      .populate('visitorId', 'name email phone company')
      .populate('hostId', 'name email department')
      .populate('attendees', 'name email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ date: -1, startTime: -1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get appointment by ID
// @route   GET /api/appointments/:id
// @access  Private
const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('visitorId', 'name email phone company purpose')
      .populate('hostId', 'name email department phone')
      .populate('attendees', 'name email phone');

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    const hasAccess = req.user.role === 'admin' ||
                     appointment.hostId._id.toString() === req.user._id.toString() ||
                     appointment.attendees.some(attendee => attendee._id.toString() === req.user._id.toString());

    if (!hasAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ appointment });
  } catch (error) {
    console.error('Get appointment by ID error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update appointment
// @route   PUT /api/appointments/:id
// @access  Private
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions (only host or admin can update)
    if (req.user.role !== 'admin' && appointment.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const allowedFields = [
      'title', 'description', 'date', 'startTime', 'endTime',
      'location', 'attendees', 'notes', 'status'
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'date') {
          appointment[field] = new Date(req.body[field]);
        } else {
          appointment[field] = req.body[field];
        }
      }
    });

    await appointment.save();

    // Populate related data
    await appointment.populate([
      { path: 'visitorId', select: 'name email phone company' },
      { path: 'hostId', select: 'name email department' },
      { path: 'attendees', select: 'name email' }
    ]);

    res.json({
      message: 'Appointment updated successfully',
      appointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete appointment
// @route   DELETE /api/appointments/:id
// @access  Private
const deleteAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions (only host or admin can delete)
    if (req.user.role !== 'admin' && appointment.hostId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Approve/Reject appointment
// @route   PUT /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['approved', 'rejected', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Check permissions
    const canUpdate = req.user.role === 'admin' ||
                     appointment.hostId.toString() === req.user._id.toString() ||
                     appointment.attendees.some(attendee => attendee._id.toString() === req.user._id.toString());

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    appointment.status = status;
    await appointment.save();

    // Populate related data
    await appointment.populate([
      { path: 'visitorId', select: 'name email phone company' },
      { path: 'hostId', select: 'name email department' },
      { path: 'attendees', select: 'name email' }
    ]);

    res.json({
      message: `Appointment ${status} successfully`,
      appointment
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  updateAppointmentStatus
};
