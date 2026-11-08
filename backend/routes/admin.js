// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all admin routes - middleware chain ensures only logged-in admins pass
router.use(protect, restrictTo('admin'));

// --- Dashboard Stats & Telemetry ---
router.get('/stats', adminController.getStats);
router.post('/broadcast', adminController.broadcastAnnouncement);

// --- User Management ---
router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.deleteUser); // Hard delete
router.put('/users/:id/ban', adminController.banUser);   // Soft ban/unban

// --- Content Moderation ---
router.get('/posts', adminController.listPosts); 

// --- Report Management ---
router.get('/reports', adminController.getReports);
router.put('/reports/:id', adminController.handleReport);

module.exports = router;
