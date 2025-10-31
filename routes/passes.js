const express = require('express');
const router = express.Router();
const {
  issuePass,
  getPasses,
  getPassById,
  revokePass,
  verifyPass
} = require('../controllers/passController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Routes for all authenticated users
router.get('/', getPasses);
router.get('/:id', getPassById);

// Admin/Security only routes
router.post('/', authorizeRoles('admin', 'security'), issuePass);
router.put('/:id/revoke', authorizeRoles('admin', 'security'), revokePass);
router.post('/verify', authorizeRoles('admin', 'security'), verifyPass);

module.exports = router;
