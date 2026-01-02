// backend/routes/users.js
const express = require('express');
const router = express.Router();
const users = require('../controllers/usersController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');

// --- Specific Routes First (Order Matters) ---

// Current User Operations
router.get('/me', protect, users.getMe);
router.delete('/me', protect, users.deleteMe);

// Settings & Preferences
router.put('/status', protect, users.updateStatus); // 🔥 Custom Status
router.put('/settings/notifications', protect, users.updateSettings); // 🔥 Notification Prefs
router.put('/password', protect, users.updatePassword);
router.put('/close-friends', protect, users.updateCloseFriends);
router.put('/pin', protect, users.pinPost); // 🔥 Pin Post to Profile

// Blocking
router.post('/:id/block', protect, users.blockUser);

// Search
router.get('/search', users.searchUsers);

// Follow Requests Management
router.get('/follow-requests', protect, users.getFollowRequests);
router.post('/requests/:id/approve', protect, users.acceptFollowRequest);
router.post('/requests/:id/reject', protect, users.declineFollowRequest);

// --- Dynamic Routes (/:id) Must Be Last ---

// Public/Protected Profile View
router.get('/:id', optionalAuth, users.getUserById);

// Profile Update (Multipart for Avatar/Cover)
router.put('/:id', protect, upload.fields([{ name: 'avatar' }, { name: 'coverPhoto' }]), users.updateProfile);

// Social Actions
router.post('/:id/follow', protect, users.followToggle);
router.get('/:id/followers', users.getFollowers);
router.get('/:id/following', users.getFollowing);

// Aliases for legacy support (optional)
router.post('/accept-request/:id', protect, users.acceptFollowRequest);
router.post('/decline-request/:id', protect, users.declineFollowRequest);

module.exports = router;