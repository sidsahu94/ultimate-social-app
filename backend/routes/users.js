// backend/routes/users.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/multer');

// import controller functions and validate they exist
const usersController = require('../controllers/usersController');

// destructure handlers (makes it easier to see missing ones)
const { getMe, getUserById, updateProfile, followToggle } = usersController || {};

// helper to assert handlers are functions
const assertHandler = (fn, name) => {
  if (typeof fn !== 'function') {
    throw new Error(`usersController.${name} is not a function or not exported properly`);
  }
};

try {
  assertHandler(getMe, 'getMe');
  assertHandler(getUserById, 'getUserById');
  assertHandler(updateProfile, 'updateProfile');
  assertHandler(followToggle, 'followToggle');
} catch (err) {
  // throw early so server startup surfaces a clear error message
  console.error('Routes/users.js initialization error:', err.message);
  throw err;
}

// routes
router.get('/me', protect, getMe);
router.get('/:id', protect, getUserById);
router.put(
  '/:id',
  protect,
  upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverPhoto', maxCount: 1 }]),
  updateProfile
);
router.post('/:id/follow', protect, followToggle);

module.exports = router;
