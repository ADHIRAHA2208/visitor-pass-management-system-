const express = require('express');
const router = express.Router();
const {
  checkInVisitor,
  checkOutVisitor,
  getCheckLogs,
  getCheckLogById,
  getVisitorCheckHistory,
  getCheckLogStats
} = require('../controllers/checkLogController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Routes for all authenticated users
router.get('/', getCheckLogs);
router.get('/:id', getCheckLogById);
router.get('/visitor/:visitorId', getVisitorCheckHistory);

// Admin/Security only routes
router.post('/checkin', authorizeRoles('admin', 'security'), checkInVisitor);
router.post('/checkout', authorizeRoles('admin', 'security'), checkOutVisitor);
router.get('/stats', authorizeRoles('admin', 'security'), getCheckLogStats);

module.exports = router;
