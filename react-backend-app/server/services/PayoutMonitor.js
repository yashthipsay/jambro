const cron = require("node-cron");
const axios = require("axios");
const Payout = require("../models/Payouts");
const { createBulkPePayout } = require("../controller/payoutsController");

const BULKPE_API_URL = "https://api.bulkpe.in/client";

class PayoutMonitor {
  constructor(io) {
    this.io = io;
    this.maxRetryAttempts = 3; // Maximum number of retry attempts
  }

  start() {
    console.log("Payout status monitor started");

    cron.schedule("*/5 * * * *", async () => {
      await this.checkPayoutStatuses();
    });

    // Retry failed payouts every 5 minutes
    cron.schedule("*/5 * * * *", async () => {
      await this.retryFailedPayouts();
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
      console.log(
        `Fetching payout details for transaction ID: ${transactionId}`
      );

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
        console.log(
          `Fetched payout details for transaction ID: ${transactionId}`
        );
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
      } else if (
        ["FAILED", "CANCELLED", "REVERSED"].includes(payoutDetails.status)
      ) {
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
      console.error(
        `Error updating payout status for payout ID: ${payout._id}`,
        error.message
      );
    }
  }

  async retryFailedPayouts() {
    try {
      console.log("Checking for failed payouts that need retry");

      // Find payouts that are marked as FAILED and are eligible for retry
      const failedPayouts = await Payout.find({
        status: "FAILED",
        $and: [
          {
            $or: [
              { retryCount: { $exists: false } },
              { retryCount: { $lt: this.maxRetryAttempts } },
            ],
          },
          {
            $or: [
              { nextRetryAt: { $exists: false } },
              { nextRetryAt: { $lte: new Date() } },
            ],
          },
        ],
      });

      console.log(
        `Found ${failedPayouts.length} failed payouts eligible for retry`
      );

      for (const payout of failedPayouts) {
        try {
          console.log(
            `Retrying payout ID: ${payout._id} (Attempt ${
              payout.retryCount + 1
            }/${this.maxRetryAttempts})`
          );

          // Retry by directly calling the BulkPe API instead of createBulkPePayout.
          // Use the existing payout record fields for reference.
          const response = await axios.post(
            `${BULKPE_API_URL}/initiatepayout`,
            {
              amount: payout.amount,
              // Retain the same reference_id so the backend recognizes this as a retry
              reference_id: payout.reference_id,
              transcation_note: "Retry: Jamroom session payout",
              // You can also include additional required details here if needed
              beneficiaryName: payout.beneficiaryName,
              upi: payout.upiId,
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.BULKPE_API_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.data.status) {
            console.log(`Retry API succeeded for payout ${payout._id}`);
            // Update the existing payout record with new details from the API
            payout.status = response.data.data.status || "PENDING";
            payout.bulkpeTransactionId = response.data.data.transcation_id;
            payout.statusDetails = "Retry successful";
          } else {
            console.error(`Retry API failed for payout ${payout._id}`);
          }

          // Update retry count and schedule the next retry (if applicable)
          payout.retryCount = (payout.retryCount || 0) + 1;
          if (payout.retryCount >= this.maxRetryAttempts) {
            payout.status = "MAX_RETRIES_REACHED";
            payout.statusDetails = "Maximum retry attempts reached";
          } else {
            payout.nextRetryAt = new Date(Date.now() + 5 * 60 * 1000); // next retry in 5 minutes
          }

          await payout.save();

          // Emit retry attempt event
          this.io.emit("payoutRetryAttempt", {
            payoutId: payout._id,
            retryCount: payout.retryCount,
            maxRetries: this.maxRetryAttempts,
          });
        } catch (error) {
          console.error(`Error retrying payout ${payout._id}:`, error);
        }
      }
    } catch (error) {
      console.error("Error in retryFailedPayouts:", error);
    }
  }
}

module.exports = PayoutMonitor;
