// backend/routes/users.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/usersController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');

// ==========================================
// 1. Current User Operations (No ID required)
// ==========================================

// Get own profile
router.get('/me', protect, userController.getMe);

// Delete own account
router.delete('/me', protect, userController.deleteAccount);

// Security
router.put('/password', protect, userController.changePassword);

// Settings & Preferences
router.put('/status', protect, userController.updateStatus); 
router.put('/settings/notifications', protect, userController.updateSettings); 
router.put('/close-friends', protect, userController.updateCloseFriends);
router.get('/blocked', protect, userController.getBlockedUsers);

// ==========================================
// 2. Search & Discovery
// ==========================================

router.get('/search', userController.searchUsers);
router.get('/follow-requests', protect, userController.getFollowRequests);

// ==========================================
// 3. Specific Actions on Other Users
// ==========================================

// Follow / Unfollow
router.post('/:id/follow', protect, userController.followToggle);

// Block User
router.post('/:id/block', protect, userController.blockUser);

// Manage Requests
router.post('/requests/:id/approve', protect, userController.acceptFollowRequest);
router.post('/requests/:id/reject', protect, userController.declineFollowRequest);
// (Legacy aliases for request management)
router.post('/accept-request/:id', protect, userController.acceptFollowRequest);
router.post('/decline-request/:id', protect, userController.declineFollowRequest);

// Get Lists
router.get('/:id/followers', userController.getFollowers);
router.get('/:id/following', userController.getFollowing);
router.put('/pin', protect, userController.pinPost); 

// ==========================================
// 4. Dynamic ID Routes (MUST BE LAST)
// ==========================================

// Update Profile (Multipart: Avatar & Cover)
router.put('/:id', protect, upload.fields([
    { name: 'avatar', maxCount: 1 }, 
    { name: 'coverPhoto', maxCount: 1 }
]), userController.updateProfile);

// Get Public User Profile
router.get('/:id', optionalAuth, userController.getUserById);

module.exports = router;