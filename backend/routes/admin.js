// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect, restrictTo('admin'));

router.get('/stats', adminController.getStats);
router.get('/users', adminController.listUsers);
router.delete('/users/:id', adminController.deleteUser);
// ... inside the router
router.get('/posts', adminController.listPosts);
// ...

// future: add post moderation endpoints here

module.exports = router;
