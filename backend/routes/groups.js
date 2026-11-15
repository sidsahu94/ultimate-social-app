// backend/routes/groups.js
const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const groupsController = require('../controllers/groupsController');

router.get('/', optionalAuth, groupsController.listGroups);
router.post('/', protect, groupsController.createGroup);
router.get('/:id', optionalAuth, groupsController.getGroup);
router.get('/:id/posts', optionalAuth, groupsController.getGroupPosts);
router.post('/:id/join', protect, groupsController.joinGroup);
router.post('/:id/leave', protect, groupsController.leaveGroup);
router.post('/:groupId/posts', protect, groupsController.postToGroup);

module.exports = router;
