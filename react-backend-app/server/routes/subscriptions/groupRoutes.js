const express = require('express');
const router = express.Router();
const { 
  createGroup, 
  getGroupsByAdmin,
  updateGroupMembers,
  deleteGroup 
} = require('../../controller/subscriptions/groupController');

// Create a new group
router.post('/create', createGroup);

// Get groups by admin
router.get('/admin/:adminId', getGroupsByAdmin);

// Update group members
router.put('/:groupId/members', updateGroupMembers);

// Delete/deactivate group
router.delete('/:groupId', deleteGroup);

module.exports = router;