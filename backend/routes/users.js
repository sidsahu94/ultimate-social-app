// backend/routes/users.js
const express = require('express');
const router = express.Router();
const users = require('../controllers/usersController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');

// Specific routes first
router.get('/me', protect, users.getMe);

// Close Friends (must come before dynamic /:id)
router.put('/close-friends', protect, users.updateCloseFriends);

// Search
router.get('/search', users.searchUsers);

// Follow requests endpoints
router.get('/follow-requests', protect, users.getFollowRequests);
router.post('/requests/:id/approve', protect, users.acceptFollowRequest);
router.post('/requests/:id/reject', protect, users.declineFollowRequest);

// Password (protect)
router.put('/password', protect, users.updatePassword);

// Dynamic user routes (last)
router.get('/:id', optionalAuth, users.getUserById);
router.put('/:id', protect, upload.fields([{ name: 'avatar' }, { name: 'coverPhoto' }]), users.updateProfile);
router.post('/:id/follow', protect, users.followToggle);
router.get('/:id/followers', users.getFollowers);
router.get('/:id/following', users.getFollowing);

module.exports = router;
