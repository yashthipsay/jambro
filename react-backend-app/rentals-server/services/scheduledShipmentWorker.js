import cron from "node-cron";
import RentalBooking from "../models/RentalsBooking.js";
import { publishJob } from "./rabbitmq.js";
import { emitToClient } from "./socket.js";

export function startScheduledShipmentWorker() {
  // Run every minute to check for bookings ready for shipment creation
  cron.schedule("*/1 * * * *", async () => {
    console.log("[scheduledShipmentWorker] Checking for bookings ready for shipment creation...");
    const now = new Date();
    console.log("[debug] now UTC:", now.toISOString());
    console.log("[debug] now IST:", now.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }));
    try {
      const now = new Date();
      // 1. rider_not_assigned
      // 2. scheduled_shipment.create_at <= now
      // 3. No Borzo order yet
      const bookings = await RentalBooking.find({
        status: "rider_not_assigned",
        "scheduled_shipment.create_at": { $lte: now },
        "shipment.borzo_order_id": { $exists: false }
      });
      console.log(`[scheduledShipmentWorker] Found ${bookings.length} bookings`);

      for (const bk of bookings) {
        try {
          // mark arranging
          bk.status = "arranging_pickup";
          await bk.save();

          // enqueue Borzo createShipment
          await publishJob("borzo_jobs", {
            type: "createShipment",
            bookingId: bk._id.toString(),
            payload: bk.scheduled_shipment.details,
            meta: { source: "scheduled_worker" }
          });

          // notify customer
          emitToClient(bk.user_id.toString(), {
            type: "status_update",
            data: {
              bookingId: bk._id,
              status: "arranging_pickup",
              message: "Your delivery is being arranged now!"
            }
          });

          console.log(`[scheduledShipmentWorker] Queued shipment for ${bk._id}`);
        } catch (err) {
          console.error(`[scheduledShipmentWorker] Failed ${bk._id}:`, err);
          bk.status = "shipment_creation_failed";
          bk.error_details = { message: err.message, timestamp: new Date() };
          await bk.save();
        }
      }
    } catch (err) {
      console.error("[scheduledShipmentWorker] Error:", err);
    }
  });

  console.log("[scheduledShipmentWorker] Started (runs every 30m)");
}