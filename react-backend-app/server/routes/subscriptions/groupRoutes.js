const express = require('express');
const router = express.Router();
const { 
  createGroup, 
  getGroupsByAdmin,
  getGroupEmails,
  updateGroupMembers,
  deleteGroup,
  getArchivedGroups,
  archiveGroup,
  reactivateGroup,
  getActiveGroupForSubscription
} = require('../../controller/subscriptions/groupController');

// Create a new group
router.post('/create', createGroup);

// Get groups by admin
router.get('/admin/:adminId', getGroupsByAdmin);

// Get group members' emails
router.get('/:groupId/emails', getGroupEmails);

// Update group members
router.put('/:groupId/members', updateGroupMembers);

// Delete group
router.delete('/:groupId', deleteGroup);

// Get archived groups
router.get('/archived/:adminId', getArchivedGroups);

// Archive group
router.post('/:groupId/archive', archiveGroup);

// Reactivate group
router.post('/:groupId/reactivate', reactivateGroup);

// Get active group for subscription
router.get('/active/:subscriptionId', getActiveGroupForSubscription);

module.exports = router;