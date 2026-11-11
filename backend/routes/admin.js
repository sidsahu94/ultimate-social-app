// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Hardware Enclave Lockdown: Only Founder Sidhanta Sahu can access admin routes
const founderEnclaveGuard = (req, res, next) => {
  const u = req.user;
  if (!u) return res.status(401).json({ message: 'Authentication required' });
  const isFounder = (
    u.email === 'sidhantas786@gmail.com' ||
    u.email === 'admin@socialapp.com' ||
    u.username === 'sidsahu' ||
    u.role === 'admin'
  );
  if (!isFounder) {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Hardware Enclave Protection restricts administrative controls to Founder Sidhanta Sahu.'
    });
  }
  next();
};

// Protect all admin routes with strict dual enclave verification
router.use(protect, restrictTo('admin'), founderEnclaveGuard);

// --- Dashboard Stats & Telemetry ---
router.get('/stats', adminController.getStats);
router.post('/broadcast', adminController.broadcastAnnouncement);
router.post('/maintenance', adminController.toggleMaintenance);

// --- User Management & Creator Treasury ---
router.get('/users', adminController.listUsers);
router.put('/users/:id/verify', adminController.toggleVerifyUser);
router.post('/users/:id/coins', adminController.grantCoins);
router.put('/users/:id/ban', adminController.banUser);
router.delete('/users/:id', adminController.deleteUser);

// --- Content Moderation ---
router.get('/posts', adminController.listPosts);

// --- Report Management ---
router.get('/reports', adminController.getReports);
router.put('/reports/:id', adminController.handleReport);

module.exports = router;
