const {
  Subscription,
  SKU,
  SKUPayment,
} = require("../../models/subscriptions/SubscriptionSchema");
const { v4: uuidv4 } = require("uuid");

// Create new subscription
const purchaseSubscription = async (req, res) => {
  try {
    const {
      userId,
      type,
      tier,
      hours,
      access,
      frequency,
      memberEmails = [],
    } = req.body;

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      primaryUserId: userId,
      status: "ACTIVE",
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: "User already has an active subscription",
      });
    }

    // Get SKU details
    const sku = await SKU.findOne({
      name: tier.toUpperCase(),
      duration: frequency,
      isActive: true,
    });

    if (!sku) {
      return res.status(404).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    // Create subscription
    const subscription = new Subscription({
      subscriptionId: uuidv4(),
      type,
      primaryUserId: userId,
      memberEmails: type === "GROUP" ? memberEmails : [],
      skuId: sku._id,
      status: "ACTIVE",
      startDate: new Date(),
      endDate: calculateEndDate(frequency),
      remainingHours: hours,
      jamRoomAccess: access === "jamrooms" || access === "both",
      studioAccess: access === "studios" || access === "both",
    });

    await subscription.save();

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: subscription,
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId, userId } = req.body;

    const subscription = await Subscription.findOne({
      subscriptionId,
      primaryUserId: userId,
      status: "ACTIVE",
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Active Subscription not found",
      });
    }

    // Calculate refund amount if applicable
    const refundAmount = calculateRefundAmount(subscription);

    subscription.status = "CANCELLED";
    await subscription.save();

    res.json({
      success: true,
      message: "Subscription cancelled successfully",
      data: { refundAmount },
    });
  } catch (error) {
    console.error("Error cancelling subscription:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Upgrade subscription
const upgradeSubscription = async (req, res) => {
  try {
    const {
      userId,
      currentSubscriptionId,
      newTier,
      newHours,
      newAccess,
      newFrequency,
    } = req.body;

    const currentSubscription = await Subscription.findOne({
      subscriptionId: currentSubscriptionId,
      primaryUserId: userId,
      status: "ACTIVE",
    });

    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        message: "Active subscription not found",
      });
    }

    // Get new SKU details
    const newSku = await SKU.findOne({
      name: newTier.toUpperCase(),
      duration: newFrequency,
      isActive: true,
    });

    if (!newSku) {
      return res.status(404).json({
        success: false,
        message: "Invalid upgrade plan",
      });
    }

    // Calculate upgrade cost
    const upgradeCost = calculateUpgradeCost(currentSubscription, newSku);

    // Update subscription
    const updatedSubscription = {
      skuId: newSku._id,
      remainingHours: newHours,
      jamRoomAccess: newAccess === "jamrooms" || newAccess === "both",
      studioAccess: newAccess === "studios" || newAccess === "both",
    };

    await Subscription.findByIdAndUpdate(
      currentSubscription._id,
      updatedSubscription
    );

    res.json({
      success: true,
      message: "Subscription upgraded successfully",
      data: { upgradeCost },
    });
  } catch (error) {
    console.error("Error upgrading subscription:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Downgrade subscription
const downgradeSubscription = async (req, res) => {
  try {
    const {
      userId,
      currentSubscriptionId,
      newTier,
      newHours,
      newAccess,
      newFrequency,
    } = req.body;

    const currentSubscription = await Subscription.findOne({
      subscriptionId: currentSubscriptionId,
      primaryUserId: userId,
      status: "ACTIVE",
    });

    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        message: "Active subscription not found",
      });
    }

    // Get new SKU details
    const newSku = await SKU.findOne({
      name: newTier.toUpperCase(),
      duration: newFrequency,
      isActive: true,
    });

    if (!newSku) {
      return res.status(404).json({
        success: false,
        message: "Invalid downgrade plan",
      });
    }

    // Calculate if any refund is due
    const refundAmount = calculateDowngradeRefund(currentSubscription, newSku);

    // Update subscription (will take effect next billing cycle)
    const updatedSubscription = {
      skuId: newSku._id,
      remainingHours: newHours,
      jamRoomAccess: newAccess === "jamrooms" || newAccess === "both",
      studioAccess: newAccess === "studios" || newAccess === "both",
    };

    await Subscription.findByIdAndUpdate(
      currentSubscription._id,
      updatedSubscription
    );

    res.json({
      success: true,
      message: "Subscription downgraded successfully",
      data: { refundAmount },
    });
  } catch (error) {
    console.error("Error downgrading subscription:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Helper functions
const calculateEndDate = (frequency) => {
  const now = new Date();
  switch (frequency) {
    case "monthly":
      return new Date(now.setMonth(now.getMonth() + 1));
    case "half_yearly":
      return new Date(now.setMonth(now.getMonth() + 6));
    case "annual":
      return new Date(now.setFullYear(now.getFullYear() + 1));
    default:
      return new Date(now.setMonth(now.getMonth() + 1));
  }
};

const calculateRefundAmount = (subscription) => {
  // Implement your refund calculation logic here
  return 0; // Placeholder
};

const calculateUpgradeCost = (currentSubscription, newSku) => {
  // Implement your upgrade cost calculation logic here
  return 0; // Placeholder
};

const calculateDowngradeRefund = (currentSubscription, newSku) => {
  // Implement your downgrade refund calculation logic here
  return 0; // Placeholder
};

module.exports = {
  purchaseSubscription,
  cancelSubscription,
  upgradeSubscription,
  downgradeSubscription,
};
