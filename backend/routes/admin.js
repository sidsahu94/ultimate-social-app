// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all admin routes - middleware chain ensures only logged-in admins pass
router.use(protect, restrictTo('admin'));

// --- Dashboard Stats ---
router.get('/stats', adminController.getStats);

// --- User Management ---
router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.deleteUser); // Hard delete
router.put('/users/:id/ban', adminController.banUser);   // Soft ban/unban

// --- Content Moderation ---
// Note: 'listPosts' was part of the original request, assuming it exists in controller
router.get('/posts', adminController.listPosts); 

// --- Report Management (New) ---
router.get('/reports', adminController.getReports);
router.put('/reports/:id', adminController.handleReport);

module.exports = router;