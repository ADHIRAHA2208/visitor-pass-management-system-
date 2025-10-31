const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Admin only routes
router.get('/', authorizeRoles('admin'), getUsers);
router.get('/stats', authorizeRoles('admin'), getUserStats);
router.delete('/:id', authorizeRoles('admin'), deleteUser);

// Routes accessible by admin or the user themselves
router.get('/:id', getUserById);
router.put('/:id', updateUser);

module.exports = router;
