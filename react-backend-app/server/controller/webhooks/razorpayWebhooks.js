const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const {
  Subscription,
  SKUPayment,
} = require("../../models/subscriptions/SubscriptionSchema");

// Webhook to handle subscription events

router.post("/subscription", async (req, res) => {
  try {
    // Verify webhook signature
    const webhookSignature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Create a signature with webhook secret
    const generatedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(JSON.stringify(req.body))
      .digest("hex");

    //   Compare signature to verify webhook
    if (webhookSignature !== generatedSignature) {
      return res.status(400).json({
        success: false,
        message: "Invalid webhook signature",
      });
    }

    const event = req.body;

    // Handle different subscription events
    switch (event.event) {
      case "subscription.authenticated":
        // Initial authentication successful
        break;

      case "subscription.charged":
        // Successful recurring payment
        await handleSuccessfulCharge(event.payload.subscription.entity);
        break;

      case "subscription.activated":
        // Subscription activated
        await updateSubscriptionStatus(
          event.payload.subscription.entity.id,
          "ACTIVE"
        );
        break;

      case "subscription.halted":
      case "subscription.cancelled":
        // Subscription halted or cancelled
        await updateSubscriptionStatus(
          event.payload.subscription.entity.id,
          "CANCELLED"
        );
        break;

      case "subscription.completed":
        // All planned charges completed
        await updateSubscriptionStatus(
          event.payload.subscription.entity.id,
          "EXPIRED"
        );
        break;

      case "subscription.pending":
        // Subscription pending authentication
        break;
    }

    res.json({ status: "Webhook received successfully" });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(500).json({ message: "Webhook processing error" });
  }
});

// Update subscription status helper
async function updateSubscriptionStatus(razorpaySubscriptionId, status) {
  await Subscription.findOneAndUpdate({ razorpaySubscriptionId }, { status });
}

// Handle successful charge helper
async function handleSuccessfulCharge(subscriptionData) {
  // Find the subscription
  const subscription = await Subscription.findOne({
    razorpaySubscriptionId: subscriptionData.id,
  });

  if (!subscription) return;

  // Create payment record
  const payment = new SKUPayment({
    skuPaymentId: crypto.randomUUID(),
    subscriptionId: subscription._id,
    userId: subscription.primaryUserId,
    amount: subscriptionData.amount / 100, // Convert paise to rupees
    paymentDate: new Date(),
    paymentType: "RECURRING",
    status: "SUCCESS",
    razorpayPaymentId: subscriptionData.payment_id,
  });

  await payment.save();

  // Update subscription end date for next billing cycle
  subscription.endDate = new Date(subscriptionData.current_end * 1000); // Convert to milliseconds
  await subscription.save();
}

module.exports = router;
