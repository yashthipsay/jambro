const cron = require("node-cron");
const Razorpay = require("razorpay");
const {
  Subscription,
  SKUPayment,
} = require("../models/subscriptions/SubscriptionSchema");
const crypto = require("crypto");

class SubscriptionSyncService {
  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET,
    });
  }

  start() {
    // Run every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
      console.log("Running subscription sync job...");
      await this.syncSubscriptions();
    });
  }

  // New method to handle pending cancellations
  async handlePendingCancellations() {
    try {
      // Find all subscriptions marked for cancellation at cycle end
      const pendingCancellations = await Subscription.find({
        pendingCancellation: true,
        cancelAtEnd: true,
        status: "ACTIVE",
      });

      console.log(
        `Found ${pendingCancellations.length} pending cancellations to process`
      );

      for (const subscription of pendingCancellations) {
        try {
          // Fetch latest subscription data from Razorpay
          const razorpaySubscription = await this.razorpay.subscriptions.fetch(
            subscription.razorpaySubscriptionId
          );

          const currentTime = new Date().getTime() / 1000; // Convert to Unix timestamp

          // Check if current billing cycle has ended
          if (
            razorpaySubscription.current_end &&
            currentTime >= razorpaySubscription.current_end
          ) {
            // Update subscription status
            subscription.status = "CANCELLED";
            subscription.pendingCancellation = false;
            subscription.cancelAtEnd = false;
            subscription.cancelledAt = new Date();

            await subscription.save();

            console.log(
              `Processed end-of-cycle cancellation for subscription ${subscription._id}`
            );

            // You might want to send a notification to the user here
            // await notificationService.sendSubscriptionCancelledNotification(subscription);
          } else {
            console.log(
              `Subscription ${subscription._id} still in active cycle, will check again later`
            );
          }
        } catch (error) {
          console.error(
            `Error processing pending cancellation for subscription ${subscription._id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Error handling pending cancellations:", error);
    }
  }

  async syncSubscriptions() {
    try {
      // Get all active/pending subscriptions from your database
      const subscriptions = await Subscription.find({
        status: { $in: ["ACTIVE", "PENDING"] },
      });

      for (const subscription of subscriptions) {
        try {
          // Fetch subscription details from Razorpay
          const razorpaySubscription = await this.razorpay.subscriptions.fetch(
            subscription.razorpaySubscriptionId
          );

          await this.syncSubscriptionStatus(subscription, razorpaySubscription);
          await this.syncPayments(subscription, razorpaySubscription);
        } catch (error) {
          console.error(
            `Error syncing subscription ${subscription._id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error("Subscription sync error:", error);
    }
  }

  async syncSubscriptionStatus(subscription, razorpayData) {
    let status = subscription.status;

    // Map Razorpay status to your status
    switch (razorpayData.status) {
      case "active":
        // Keep status as ACTIVE if it's pending cancellation
        status = subscription.pendingCancellation ? "ACTIVE" : "ACTIVE";
        break;
      case "authenticated":
      case "pending":
        status = "PENDING";
        break;
      case "halted":
      case "cancelled":
        status = "CANCELLED";
        // Clear pending cancellation flags if cancelled
        subscription.pendingCancellation = false;
        subscription.cancelAtEnd = false;
        subscription.cancelledAt = subscription.cancelledAt || new Date();
        break;
      case "completed":
        status = "EXPIRED";
        break;
    }

    if (
      status !== subscription.status ||
      razorpayData.current_end !== subscription.endDate?.getTime() / 1000
    ) {
      subscription.status = status;
      subscription.endDate = new Date(razorpayData.current_end * 1000);
      await subscription.save();
      console.log(
        `Updated subscription ${subscription._id} status to ${status}`
      );
    }
  }

  async syncPayments(subscription, razorpayData) {
    try {
      // Fetch all payments for this subscription from Razorpay
      const payments = await this.razorpay.payments.all({
        subscription_id: razorpayData.id,
      });

      for (const payment of payments.items) {
        // Check if payment already exists in your database
        const existingPayment = await SKUPayment.findOne({
          razorpayPaymentId: payment.id,
        });

        if (!existingPayment && payment.status === "captured") {
          // Create new payment record
          const newPayment = new SKUPayment({
            skuPaymentId: crypto.randomUUID(),
            subscriptionId: subscription._id,
            userId: subscription.primaryUserId,
            amount: payment.amount / 100,
            paymentDate: new Date(payment.created_at * 1000),
            paymentType: "RECURRING",
            status: "SUCCESS",
            razorpayPaymentId: payment.id,
          });

          await newPayment.save();
          console.log(
            `Added new payment record for subscription ${subscription._id}`
          );
        }
      }
    } catch (error) {
      console.error(
        `Error syncing payments for subscription ${subscription._id}:`,
        error
      );
    }
  }
}

module.exports = SubscriptionSyncService;
