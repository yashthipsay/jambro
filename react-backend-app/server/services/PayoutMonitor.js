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
        status: { $in: ["PENDING", "PROCESSING", "QUEUED"] },
      });

      // console.log(`pendingPayouts.length} pending payouts to check`);

      for (const payout of pendingPayouts) {
        try {
          const payoutDetails = await this.fetchPayoutDetails(
            payout.bulkpeTransactionId
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

  async fetchPayoutDetails(transactionId) {
    try {
      console.log(`Fetching payout details for transaction ID: ${transactionId}`);

      const response = await axios.post(
        "https://api.bulkpe.in/client/fetchStatus",
        { transcation_id: transactionId },
        {
          headers: {
            Authorization: `Bearer ${process.env.BULKPE_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        console.log(`Fetched payout details for transaction ID: ${transactionId}`);
        return response.data.data;
      } else {
        console.error(
          `Failed to fetch payout details for transaction ID: ${transactionId}. Response:`,
          response.data
        );
        return null;
      }
    } catch (error) {
      console.error(
        `Error fetching payout details for transaction ID: ${transactionId}`,
        error.message
      );
      return null;
    }
  }

  async updatePayoutStatus(payout, payoutDetails) {
    try {
      console.log(`Updating payout status for payout ID: ${payout._id}`);

      // Map BulkPe status to our status
      let newStatus = payout.status;
      if (payoutDetails.status === "SUCCESS") {
        newStatus = "COMPLETED";
      } else if (["FAILED", "CANCELLED", "REVERSED"].includes(payoutDetails.status)) {
        newStatus = payoutDetails.status;
      } else {
        newStatus = "PENDING"; // Default to pending for other statuses
      }

      // Update payout in the database
      if (newStatus !== payout.status) {
        payout.status = newStatus;
        payout.utr = payoutDetails.utr;
        payout.statusDetails = payoutDetails.statusDescription;
        payout.updatedAt = new Date(payoutDetails.updatedAt);
        await payout.save();

        console.log(`Updated payout ${payout._id} status to ${newStatus}`);

        // Emit WebSocket event for real-time updates
        this.io.emit("payoutStatusUpdate", {
          payoutId: payout._id,
          status: newStatus,
          details: payoutDetails.statusDescription,
        });
      }
    } catch (error) {
      console.error(`Error updating payout status for payout ID: ${payout._id}`, error.message);
    }
  }
}

module.exports = PayoutMonitor;
