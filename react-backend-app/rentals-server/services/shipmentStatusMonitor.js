import cron from "node-cron";
import RentalBooking from "../models/RentalsBooking.js";
import { borzoService } from "./borzoService.js";
import { statusMap } from "./borzoTracker.js";
import { emitToClient } from "./socket.js";

export function startShipmentStatusMonitor() {
  cron.schedule("*/1 * * * *", async () => {
    console.log("[shipmentMonitor] polling Borzo order statuses…");
    const bookings = await RentalBooking.find({
      "shipment.borzo_order_id": { $exists: true }
    });
    for (const bk of bookings) {
      try {
        const res = await borzoService.getOrderStatus(bk.shipment.borzo_order_id);
        const rawStatus = res.orders?.[0]?.status;
        const mapped = statusMap[rawStatus];
        if (mapped && bk.status !== mapped) {
          bk.status = mapped;
          bk.shipment.tracking_status = rawStatus;
          bk.shipment.last_tracked_at = new Date();
          await bk.save();
          emitToClient(bk.user_id.toString(), {
            type: "tracking_update",
            data: { bookingId: bk._id, status: mapped, rawStatus }
          });
          console.log(`[shipmentMonitor] updated booking ${bk._id} → ${mapped}`);
        }
      } catch (err) {
        console.error("[shipmentMonitor] error polling booking", bk._id, err.message);
      }
    }
  });
  console.log("[shipmentMonitor] scheduled Borzo-poll every minute");
}