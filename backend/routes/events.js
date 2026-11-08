// backend/routes/events.js
const express = require('express');
const router = express.Router();
const appsController = require('../controllers/appsController');
const { protect } = require('../middleware/authMiddleware');

const optionalAuth = (req, res, next) => {
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    return protect(req, res, next);
  }
  next();
};

router.get('/', optionalAuth, appsController.getEvents);
router.post('/', protect, appsController.createEvent);
router.post('/:id/join', protect, appsController.joinEvent);
router.delete('/:id', protect, appsController.deleteEvent);

module.exports = router;
