const cron = require("node-cron");
const axios = require("axios");
const Payout = require("../models/Payouts");

class PayoutMonitor {
  constructor(io) {
    this.io = io;
  }

  start() {
    console.log("Payout status monitor started");

    cron.schedule("*/5 * * * *", async () => {
      await this.checkPayoutStatuses();
    });
  }

  async checkPayoutStatuses() {
    try {
      // Get all pending/processing/queued payouts
      const pendingPayouts = await Payout.find({
        status: { $in: ["PENDING", "queued", "processing"] },
      });

      // console.log(`pendingPayouts.length} pending payouts to check`);

      for (const payout of pendingPayouts) {
        try {
          const payoutDetails = await this.fetchPayoutDetails(
            payout.razorpayPayoutId
          );

          if (payoutDetails) {
            await this.updatePayoutStatus(payout, payoutDetails);
          }
        } catch (error) {
          console.error(`Error checking payout ${payout._id}:`, error);
        }
      }
    } catch (error) {
      // console.error('Error in checkPayoutStatuses:', error);
    }
  }

  async fetchPayoutDetails(payoutId) {
    try {
      const response = await axios.get(
        `https://api.razorpay.com/v1/payouts/${payoutId}`,
        {
          auth: {
            username: process.env.RAZORPAY_API_KEY,
            password: process.env.RAZORPAY_API_SECRET,
          },
        }
      );

      return response.data;
    } catch (error) {
      // console.error('Error fetching payout details:', error);
      return null;
    }
  }

  async updatePayoutStatus(payout, payoutDetails) {
    try {
      // Map razorpay status to our status
      let newStatus = payout.status;
      if (payoutDetails.status === "processed") {
        newStatus = "COMPLETED";
      } else if (
        ["failed", "cancelled", "reversed"].includes(payoutDetails.status)
      ) {
        newStatus = payoutDetails.status.toUppercase();
      } else {
        newStatus = payoutDetails.status;
      }

      // Update payout in database
      if (newStatus !== payout.status) {
        payout.status = newStatus;
        payout.utr = payoutDetails.utr;
        payout.statusDetails = payoutDetails.status_details;
        await payout.save();

        // console.log(`Updated payout ${payout._id} status to ${newStatus}`);

        // Emit websocket event for real-time updates
        this.io.emit("payoutStatusUpdate", {
          payoutId: payout._id,
          status: newStatus,
          details: payoutDetails.status_details,
        });
      }
    } catch (error) {
      // console.error('Error updating payout status:', error);
    }
  }
}

module.exports = PayoutMonitor;
