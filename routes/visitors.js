const express = require('express');
const router = express.Router();
const {
  createVisitor,
  getVisitors,
  getVisitorById,
  updateVisitor,
  uploadPhoto,
  updateVisitorStatus
} = require('../controllers/visitorController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Routes for all authenticated users
router.post('/', createVisitor);
router.get('/', getVisitors);
router.get('/:id', getVisitorById);
router.put('/:id', updateVisitor);

// Photo upload route
router.post('/:id/photo', uploadPhoto);

// Status update route (admin, security, or host)
router.put('/:id/status', updateVisitorStatus);

module.exports = router;
