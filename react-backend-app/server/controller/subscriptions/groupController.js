const Group = require('../../models/subscriptions/GroupSchema');
const { v4: uuidv4 } = require('uuid');

// Create a new group
const createGroup = async (req, res) => {
  try {
    const { adminId, adminEmail, groupName, memberEmails, subscriptionId } = req.body;

    // Check if group limit is reached for these members
    const memberGroupCount = await Group.countDocuments({
      'groupMembers.email': { $in: memberEmails },
      status: 'ACTIVE'
    });

    if (memberGroupCount > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more members are already part of another active group"
      });
    }

    const group = new Group({
      groupId: uuidv4(),
      groupName,
      groupDescription: `Group created by ${adminEmail}`,
      groupAdmin: adminId,
      subscriptionId,
      groupMembers: [
        // Add admin as first member
        {
          email: adminEmail,
          role: 'ADMIN',
          status: 'ACTIVE'
        },
        // Add other members
        ...memberEmails.map(email => ({
          email,
          role: 'MEMBER',
          status: 'PENDING'
        }))
      ]
    });

    await group.save();

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: group
    });

  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating group"
    });
  }
};

// Get groups by admin
const getGroupsByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const groups = await Group.find({
      groupAdmin: adminId,
      status: 'ACTIVE'
    });

    res.json({
      success: true,
      data: groups
    });

  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching groups"
    });
  }
};

// Get group members' emails
const getGroupEmails = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findOne({
      groupId,
      status: 'ACTIVE'
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    const emails = group.groupMembers.map(member => member.email);

    res.json({
      success: true,
      data: emails
    });

  } catch (error) {
    console.error("Error fetching group emails:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching group emails"
    });
  }
};

// Delete/Deactivate group
const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId } = req.body; // To verify admin permission

    const group = await Group.findOne({ groupId });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found"
      });
    }

    // Verify admin permission
    if (group.groupAdmin.toString() !== adminId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this group"
      });
    }

    // Soft delete - update status to INACTIVE
    group.status = 'INACTIVE';
    await group.save();

    res.json({
      success: true,
      message: "Group deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting group:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error deleting group"
    });
  }
};

// Update group members
const updateGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId, memberEmails } = req.body;

    const group = await Group.findOne({
      groupId,
      groupAdmin: adminId,
      status: 'ACTIVE'
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found or unauthorized"
      });
    }

    // Keep admin in the group and update other members
    const updatedMembers = [
      group.groupMembers.find(member => member.role === 'ADMIN'),
      ...memberEmails.map(email => ({
        email,
        role: 'MEMBER',
        status: 'PENDING'
      }))
    ];

    group.groupMembers = updatedMembers;
    await group.save();

    res.json({
      success: true,
      message: "Group members updated successfully",
      data: group
    });

  } catch (error) {
    console.error("Error updating group members:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating group members"
    });
  }
};

module.exports = {
  createGroup,
  getGroupsByAdmin,
  getGroupEmails,
  deleteGroup,
  updateGroupMembers
};