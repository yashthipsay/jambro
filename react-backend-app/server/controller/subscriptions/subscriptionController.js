const {
  Subscription,
  SKU,
  SKUPayment,
} = require("../../models/subscriptions/SubscriptionSchema");
const User = require("../../models/User");
const { v4: uuidv4 } = require("uuid");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Group = require("../../models/subscriptions/GroupSchema");
require("dotenv").config();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

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

    // First check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

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
      name: tier,
      duration: 1,
      isActive: true,
    });

    if (!sku) {
      return res.status(404).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    // Create Razorpay plan
    const plan = await razorpay.plans.create({
      period: "monthly",
      interval: 1,
      item: {
        name: `${tier.toUpperCase()} ${type} Plan`,
        amount: sku.price * 100, // Convert to paise
        currency: "INR",
        description: `${hours} hours per month, ${access} access`,
      },
    });

    // Create razorpay subscription
    const razorpaySubscription = await razorpay.subscriptions.create({
      plan_id: plan.id,
      total_count: 12,
      quantity: 1,
      customer_notify: 1,
      notes: {
        userId: userId,
        type: type,
        tier: tier,
        access: access,
      },
    });

    // Create subscription
    const subscription = new Subscription({
      subscriptionId: uuidv4(),
      type,
      primaryUserId: userId,
      skuId: sku._id,
      status: "PENDING",
      startDate: new Date(),
      endDate: calculateEndDate("monthly"),
      remainingHours: hours,
      accessType: access.toUpperCase(),
      razorpaySubscriptionId: razorpaySubscription.id,
    });

    await subscription.save();

    // Return checkout options
    const checkoutOptions = {
      key: process.env.RAZORPAY_API_KEY, // Use the API_KEY not KEY_ID
      subscription_id: razorpaySubscription.id,
      name: "GigSaw",
      description: `${tier} ${type} Plan - ${
        frequency === 1 ? "Monthly" : frequency === 6 ? "Half-Yearly" : "Annual"
      }`,
      prefill: {
        name: user.name,
        email: user.email,
        contact: user.phone || "",
      },
      theme: {
        color: "#6434fc",
      },
      modal: {
        confirm_close: true,
        escape: false,
      },
      notes: {
        userId: userId,
        type: type,
        tier: tier,
        access: access,
      },
    };

    res.status(201).json({
      success: true,
      message: "Subscription created successfully",
      data: {
        subscription,
        checkoutOptions,
      },
    });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Verify payment and activate subscription
const verifySubscriptionPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_subscription_id,
      razorpay_signature,
    } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
      .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      // Activate subscription
      const subscription = await Subscription.findOne({
        razorpaySubscriptionId: razorpay_subscription_id,
      });

      if (subscription) {
        subscription.status = "ACTIVE";
        subscription.paymentId = razorpay_payment_id;
        await subscription.save();

        return res.json({
          success: true,
          message: "Payment verified and subscription activated",
        });
      }
    }

    res.status(400).json({
      success: false,
      message: "Payment verification failed",
    });
  } catch (error) {
    console.error("Error verifying payment:", error);
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

const updateSubscription = async (req, res) => {
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
        message: "Invalid plan",
      });
    }

    // Determine if this is an upgrade or downgrade
    const tierRanking = { BASIC: 1, PRO: 2, PREMIUM: 3 };
    const isUpgrade =
      tierRanking[newTier.toUpperCase()] >
      tierRanking[currentSubscription.tier.toUpperCase()];

    // Calculate cost adjustment (positive for upgrade cost, negative for refund)
    const costAdjustment = isUpgrade
      ? calculateUpgradeCost(currentSubscription, newSku)
      : -calculateDowngradeRefund(currentSubscription, newSku);

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
      message: `Subscription ${
        isUpgrade ? "upgraded" : "downgraded"
      } successfully`,
      data: {
        costAdjustment,
        isUpgrade,
      },
    });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserSubscription = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find active subscription for this user
    const subscription = await Subscription.findOne({
      primaryUserId: userId,
      status: "ACTIVE"
    }).populate('skuId');
    
    if (!subscription) {
      return res.json({
        success: true,
        message: "No active subscription found",
        data: null
      });
    }
    
    // Get SKU details and merge with subscription
    const sku = subscription.skuId;
    
    const subscriptionData = {
      ...subscription.toObject(),
      tier: sku.name,
      hoursPerMonth: sku.hoursPerMonth
    };
    
    res.json({
      success: true,
      message: "Subscription found",
      data: subscriptionData
    });
  } catch (error) {
    console.error("Error fetching user subscription:", error);
    res.status(500).json({
      success: false,
      message: error.message
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
  updateSubscription,
  verifySubscriptionPayment,
  getUserSubscription
};

/*Razorpay subscription integration guide
  - Create a plan 
   Curl request: 
    curl -u [YOUR_KEY_ID]:[YOUR_KEY_SECRET] \
-X POST https://api.razorpay.com/v1/plans \
-H "Content-Type: application/json" \
-d '{
  "period": "monthly",
  "interval": 1,
  "item": {
    "name": "Test plan - Weekly",
    "amount": 69900,
    "currency": "INR",
    "description": "Description for the test plan"
  },
  "notes": {
    "notes_key_1": "Tea, Earl Grey, Hot",
    "notes_key_2": "Tea, Earl Grey… decaf."
  }
}'

Response: 
{
  "id":"plan_00000000000001",
  "entity":"plan",
  "interval":1,
  "period":"weekly",
  "item":{
    "id":"item_00000000000001",
    "active":true,
    "name":"Test plan - Weekly",
    "description":"Description for the test plan - Weekly",
    "amount":69900,
    "unit_amount":69900,
    "currency":"INR",
    "type":"plan",
    "unit":null,
    "tax_inclusive":false,
    "hsn_code":null,
    "sac_code":null,
    "tax_rate":null,
    "tax_id":null,
    "tax_group_id":null,
    "created_at":1580219935,
    "updated_at":1580219935
  },
  "notes":{
    "notes_key_1":"Tea, Earl Grey, Hot",
    "notes_key_2":"Tea, Earl Grey… decaf."
  },
  "created_at":1580219935
}

Lets just go with the montly plan rn


- Create a subscription: 
curl -u [YOUR_KEY_ID]:[YOUR_KEY_SECRET] \
-X POST https://api.razorpay.com/v1/subscriptions \
-H "Content-Type: application/json" \
-d '{
   "plan_id":"plan_00000000000001",
   "total_count":6,
   "quantity":1,
   "customer_notify":1,
   "start_at":1580453311,
   "expire_by":1580626111,
   "addons":[
      {
         "item":{
            "name":"Delivery charges",
            "amount":30000,
            "currency":"INR"
         }
      }
   ],
   "offer_id":"offer_JHD834hjbxzhd38d",
   "notes":{
      "notes_key_1":"Tea, Earl Grey, Hot",
      "notes_key_2":"Tea, Earl Grey… decaf."
   }
}'

Response: 
{
  "id": "sub_00000000000001",
  "entity": "subscription",
  "plan_id": "plan_00000000000001",
  "status": "created",
  "current_start": null,
  "current_end": null,
  "ended_at": null,
  "quantity": 1,
  "notes":{
    "notes_key_1":"Tea, Earl Grey, Hot",
    "notes_key_2":"Tea, Earl Grey… decaf."
  },
  "charge_at": 1580453311,
  "start_at": 1580626111,
  "end_at": 1583433000,
  "auth_attempts": 0,
  "total_count": 6,
  "paid_count": 0,
  "customer_notify": true,
  "created_at": 1580280581,
  "expire_by": 1580626111,
  "short_url": "https://rzp.io/i/z3b1R61A9",
  "has_scheduled_changes": false,
  "change_scheduled_at": null,
  "source": "api",
  "offer_id":"offer_JHD834hjbxzhd38d",
  "remaining_count": 5
}

We want to stick to the monthly plan here


- Final checkout: 
Create options here, adding the subscription plan in it. It will look like this: 
<button id = "rzp-button1">Pay</button>
		<script src = "https://checkout.razorpay.com/v1/checkout.js"></script>
		<script>
			var options = {
				"key": "key_id",
				"subscription_id": "sub_00000000000001",
				"name": "Acme Corp.",
				"description": "Monthly Test Plan",
				"image": "/your_logo.jpg",
				"handler": function(response) {
					alert(response.razorpay_payment_id),
					alert(response.razorpay_subscription_id),
					alert(response.razorpay_signature);
				},
				"prefill": {
					"name": "Gaurav Kumar",
					"email": "gaurav.kumar@example.com",
					"contact": "+919876543210"
				},
				"notes": {
					"note_key_1": "Tea. Earl Grey. Hot",
					"note_key_2": "Make it so."
				},
				"theme": {
					"color": "#F37254"
				}
			};
		var rzp1 = new Razorpay(options);
		document.getElementById('rzp-button1').onclick = function(e) {
			rzp1.open();
			e.preventDefault();
		}
		</script>

    Payment verification: 
    generated_signature = hmac_sha256(razorpay_payment_id + "|" + subscription_id, secret);

if (generated_signature == razorpay_signature) {
payment is successful
}

*/
