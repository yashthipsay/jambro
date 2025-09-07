import { consumeJobs } from "../services/rabbitmq.js";
import borzoService from "../services/borzoService.js";
import RentalBooking from "../models/RentalsBooking.js";

async function handleBorzoJob(job) {
  switch (job.type) {
    case "calculate":
      const result = await borzoService.calculatePrice(job.payload);
      if (job.meta?.clientSocketId) {
        // placeholder for socket emit integration
        // websocketService.send(job.meta.clientSocketId, { type: 'price_calculated', result });
      }
      console.log('[worker] price calculated');
      break;

    case "create":
    case "createShipment":{
      if (!job.bookingId) throw new Error("bookingId missing");
      const booking = await RentalBooking.findById(job.bookingId).populate("instrument_id owner_shop_id");
      if (!booking) throw new Error("Booking not found");

      const shipment = await borzoService.createShipment({
        pickup_address: job.pickup_address || booking.owner_shop_id?.pickup_address,
        customer_address: job.customer_address || booking.customer?.address,
        matter: job.matter || `Rental: ${booking.instrument_id?.name}`,
        weight_kg: job.weight_kg || booking.instrument_id?.shipping_details?.weight_kg
      });

      booking.shipment = {
        borzo_order_id: shipment.order_id,
        awb: shipment.awb,
        label_url: shipment.label_url,
        scheduled_pickup_slot: shipment.scheduled_slot,
        tracking_status: shipment.status,
        last_tracked_at: new Date()
      };
      booking.status = "ready_to_ship";
      await booking.save();
      console.log('[worker] shipment created for booking', booking._id.toString());
      break;
    }

    default:
      console.warn("[worker] unknown job type:", job.type);
  }
}

// Start consuming jobs
consumeJobs(process.env.RABBIT_QUEUE || "borzo_jobs", handleBorzoJob);
