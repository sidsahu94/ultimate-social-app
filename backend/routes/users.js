// backend/routes/users.js

const express = require('express');
const router = express.Router();
const users = require('../controllers/usersController');
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const upload = require('../utils/multer'); // Ensure this import exists

// 1. SPECIFIC ROUTES FIRST (Crucial!)
router.get('/me', protect, users.getMe);
router.get('/search', async (req, res) => { /* ... keep your search logic ... */ });

// This was causing the 500 error because it was below /:id
router.get('/follow-requests', protect, users.getFollowRequests); 
router.post('/requests/:id/approve', protect, users.acceptFollowRequest);
router.post('/requests/:id/reject', protect, users.declineFollowRequest);

// 2. DYNAMIC ROUTES LAST
router.get('/:id', optionalAuth, users.getUserById);
router.put('/:id', protect, upload.fields([{name:'avatar'},{name:'coverPhoto'}]), users.updateProfile);
router.post('/:id/follow', protect, users.followToggle);
router.get('/:id/followers', optionalAuth, users.listFollowers);
router.get('/:id/following', optionalAuth, users.listFollowing);
router.put('/password', protect, users.updatePassword);

module.exports = router;