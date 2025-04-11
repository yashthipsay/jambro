const cron = require("node-cron");
const moment = require("moment-timezone");
const BookingSchema = require("../models/BookingSchema");
const { createBulkPePayout } = require("../controller/payoutsController");

class SessionMonitor {
  constructor(io) {
    this.io = io;
  }

  start() {
    console.log("Session monitor started");
    // Check every minute
    cron.schedule("* * * * *", async () => {
      await this.checkSessions();
    });
  }

  async checkSessions() {
    const currentDate = moment().tz("Asia/Kolkata");
    // console.log('Current Date:', currentDate.format());

    try {
      // 1. Get all active bookings
      const bookings = await BookingSchema.find({
        status: { $nin: ["COMPLETED", "TERMINATED"] },
      }).populate("jamRoom");

      // console.log(`Found ${bookings.length} active bookings to check`);

      // 2. Debug log all booking IDs first
      // console.log('All booking IDs:', bookings.map(b => b._id));

      // 3. Process each booking
      for (const booking of bookings) {
        try {
          // console.log(`\nProcessing booking ${booking._id} with current status: ${booking.status}`);

          const bookingDate = moment(booking.date)
            .tz("Asia/Kolkata")
            .startOf("day");

          // Sort slots by start time
          const sortedSlots = [...booking.slots].sort((a, b) => {
            const aStart = moment(a.startTime, "HH:mm");
            const bStart = moment(b.startTime, "HH:mm");
            return aStart - bStart;
          });

          const startTimes = sortedSlots.map((slot) => {
            const [hours, minutes] = slot.startTime.split(":");
            return bookingDate.clone().set({
              hour: parseInt(hours),
              minute: parseInt(minutes),
            });
          });

          // console.log('Booking date:', bookingDate.format());
          // console.log('Start times:', startTimes.map(t => t.format()));

          const endTimes = sortedSlots.map((slot) => {
            const [hours, minutes] = slot.endTime.split(":");
            return bookingDate.clone().set({
              hour: parseInt(hours),
              minute: parseInt(minutes),
            });
          });

          const earliestStart = moment.min(startTimes);
          const latestEnd = moment.max(endTimes);

          const bookingDetails = {
            bookingId: booking._id,
            currentTime: currentDate.format(),
            earliestStart: earliestStart.format(),
            latestEnd: latestEnd.format(),
            isBetween: currentDate.isBetween(
              earliestStart,
              latestEnd,
              null,
              "[]"
            ),
            status: booking.status,
          };

          // console.log('Booking details:', bookingDetails);

          // Handle status transitions
          if (
            currentDate.isBetween(earliestStart, latestEnd, null, "[]") &&
            booking.status === "NOT_STARTED"
          ) {
            // console.log(`Updating booking ${booking._id} to ONGOING`);
            booking.status = "ONGOING";
            await booking.save();

            // Verify the save
            const updatedBooking = await BookingSchema.findById(booking._id);
            // console.log(`Booking status after save: ${updatedBooking.status}`);

            this.io.emit("sessionStatusUpdate", {
              bookingId: booking._id,
              status: "ONGOING",
            });
          } else if (currentDate.isAfter(latestEnd)) {
            // console.log(`Updating booking ${booking._id} to COMPLETED`);
            booking.status = "COMPLETED";
            await booking.save();

            this.io.emit("sessionStatusUpdate", {
              bookingId: booking._id,
              status: "COMPLETED",
            });

            await this.processPayout(booking);
          }
        } catch (error) {
          // console.error(`Error processing booking ${booking._id}:`, error);
          continue; // Continue with next booking even if one fails
        }
      }
    } catch (error) {
      // console.error('Error in checkSessions:', error);
    }
  }

  async processPayout(booking) {
    try {
      console.log(`Processing payout for booking ID: ${booking._id}`);
      // Skip payout if booking is terminated
      if (booking.status === "TERMINATED") {
        return;
      }

      if (!booking.totalAmount || isNaN(booking.totalAmount)) {
        throw new Error("Invalid totalAmount in booking");
      }

      // deduct 10% of the total amount, for actual production
      // const amount = booking.totalAmount * 0.9;

      // for testing
      const amount = booking.totalAmount;
      console.log(`Payout amount for booking ID: ${booking._id} is ${amount}`);

      const mockResponse = {
        json: (data) => console.log("Payout response:", data),
        status: (code) => ({
          json: (data) => console.log("Status:", code, "Data:", data),
        }),
      };

      const payoutResponse = await createBulkPePayout(
        {
          body: {
            jamroomId: booking.jamRoom._id,
            amount: amount,
            purpose: "Jamroom session payout",
            bookingId: booking._id,
          },
        },
        mockResponse
      );

      console.log(`Payout processed for booking ${booking._id}`);
    } catch (error) {
      console.error("Payout processing error:", error);
    }
  }
}

module.exports = SessionMonitor;
