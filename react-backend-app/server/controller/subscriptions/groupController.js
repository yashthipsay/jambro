const Group = require("../../models/subscriptions/GroupSchema");
const {
  Subscription,
} = require("../../models/subscriptions/SubscriptionSchema");
const { v4: uuidv4 } = require("uuid");

// Create a new group
const createGroup = async (req, res) => {
  try {
    const { adminId, adminEmail, groupName, memberEmails, subscriptionId } =
      req.body;

    // Check if group limit is reached for these members
    const memberGroupCount = await Group.countDocuments({
      "groupMembers.email": { $in: memberEmails },
      status: "ACTIVE",
    });

    if (memberGroupCount > 0) {
      return res.status(400).json({
        success: false,
        message: "One or more members are already part of another active group",
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
          role: "ADMIN",
          status: "ACTIVE",
        },
        // Add other members
        ...memberEmails.map((email) => ({
          email,
          role: "MEMBER",
          status: "PENDING",
        })),
      ],
    });

    await group.save();

    res.status(201).json({
      success: true,
      message: "Group created successfully",
      data: group,
    });
  } catch (error) {
    console.error("Error creating group:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating group",
    });
  }
};

// Get groups by admin
const getGroupsByAdmin = async (req, res) => {
  try {
    const { adminId } = req.params;

    const groups = await Group.find({
      groupAdmin: adminId,
      status: "ACTIVE",
    });

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    console.error("Error fetching groups:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching groups",
    });
  }
};

const getActiveGroupForSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const group = await Group.findOne({ subscriptionId, status: "ACTIVE" });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "No active group found",
      });
    }
    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Get group members' emails
const getGroupEmails = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findOne({
      groupId,
      status: "ACTIVE",
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    const emails = group.groupMembers.map((member) => member.email);

    res.json({
      success: true,
      data: emails,
    });
  } catch (error) {
    console.error("Error fetching group emails:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error fetching group emails",
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
      status: "ACTIVE",
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found or unauthorized",
      });
    }

    // Keep admin in the group and update other members
    const updatedMembers = [
      group.groupMembers.find((member) => member.role === "ADMIN"),
      ...memberEmails.map((email) => ({
        email,
        role: "MEMBER",
        status: "PENDING",
      })),
    ];

    group.groupMembers = updatedMembers;
    await group.save();

    res.json({
      success: true,
      message: "Group members updated successfully",
      data: group,
    });
  } catch (error) {
    console.error("Error updating group members:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error updating group members",
    });
  }
};

// Get archived groups
const getArchivedGroups = async (req, res) => {
  try {
    const { adminId } = req.params;
    const groups = await Group.find({
      groupAdmin: adminId,
      isArchived: true,
      status: { $ne: "DELETED" },
    });

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return res.status(400).json({
        success: false,
        message: "Only admin can delete the group",
      });
    }

    const group = await Group.findOne({ groupId, groupAdmin: adminId });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if group has active subscription
    const subscription = await Subscription.findOne({
      _id: group.subscriptionId,
      status: "ACTIVE",
    });

    if (subscription) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete group with active subscription",
      });
    }

    group.status = "DELETED";
    group.deletedAt = new Date();
    await group.save();

    res.json({
      success: true,
      message: "Group deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const archiveGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findOne({ groupId });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    group.isArchived = true;
    group.status = "INACTIVE";
    group.deactivatedAt = new Date();
    await group.save();

    res.json({
      success: true,
      message: "Group archived successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const reactivateGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    const group = await Group.findOne({ groupId });
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Check if there's already an active group for any of the members
    const memberEmails = group.groupMembers.map((member) => member.email);
    const activeGroup = await Group.findOne({
      "groupMembers.email": { $in: memberEmails },
      status: "ACTIVE",
    });

    if (activeGroup) {
      return res.status(400).json({
        success: false,
        message: "One or more members are already part of another active group",
      });
    }

    group.isArchived = false;
    group.status = "ACTIVE";
    group.deactivatedAt = null;
    await group.save();

    res.json({
      success: true,
      message: "Group reactivated successfully",
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createGroup,
  getGroupsByAdmin,
  getGroupEmails,
  deleteGroup,
  updateGroupMembers,
  getArchivedGroups,
  archiveGroup,
  reactivateGroup,
  getActiveGroupForSubscription,
};
