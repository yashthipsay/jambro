// src/workers/borzoTracker.js
import RentalBooking from "../models/RentalsBooking.js";
import { consumeJobs } from "../services/rabbitmq.js";
import { borzoService } from "../services/borzoService.js";
import { emitToClient } from "../services/socket.js";

const statusMap = {
  // Order-level
  new: "pending",
  available: "ready_to_ship",
  active: "pickup_scheduled",
  completed: "delivered",
  canceled: "cancelled",
  delayed: "pending",

  // Delivery-level
  planned: "ready_to_ship",
  courier_assigned: "pickup_scheduled",
  courier_departed: "in_transit",
  courier_at_pickup: "in_transit",
  parcel_picked_up: "in_transit",
  active: "in_transit",
  courier_arrived: "in_transit",
  finished: "delivered",
  return_planned: "return_requested",
  return_courier_assigned: "return_pickup_scheduled",
  return_courier_departed: "return_pickup_scheduled",
  return_courier_picked_up: "return_pickup_scheduled",
  return_finished: "returned",
};

export async function startBorzoTracker() {
  await consumeJobs("borzo_tracking", async (job) => {
    const { borzo_order_id, bookingId } = job;

    try {
      const tracking = await borzoService.getOrderStatus(borzo_order_id);

      const booking = await RentalBooking.findById(bookingId);
      if (!booking) return;

      const mappedStatus = statusMap[tracking.status];
      if (mappedStatus && booking.status !== mappedStatus) {
        booking.status = mappedStatus;
        booking.shipment.tracking_status = tracking.status;
        booking.shipment.last_tracked_at = new Date();
        await booking.save();

        // Emit to frontend via WS
        emitToClient(booking.user_id.toString(), {
          type: "tracking_update",
          bookingId: booking._id,
          status: mappedStatus,
          rawStatus: tracking.status,
        });

        console.log(`Booking ${booking._id} updated to ${mappedStatus}`);
      }
    } catch (err) {
      console.error("Error polling Borzo order:", err.message);
    }
  });
}
