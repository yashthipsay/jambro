import 'dotenv/config';
import { consumeJobs, connectRabbit, publishJob } from "../services/rabbitmq.js";
import borzoService from "../services/borzoService.js";
import { borzoService as borzoServiceTracker } from "../services/borzoService.js";
import RentalBooking from "../models/RentalsBooking.js";
import RentalInstrument from "../models/RentalInstruments.js"; // Add this import
import RentalShop from "../models/RentalsShops.js"; // Add this import
import { emitToClient } from "../services/socket.js";
import connectDB from "../db/mongoDriver.js";

const statusMap = {
  new: "pending",
  available: "ready_to_ship", 
  active: "pickup_scheduled",
  completed: "delivered",
  canceled: "cancelled",
  delayed: "pending",
  planned: "ready_to_ship",
  courier_assigned: "pickup_scheduled",
  courier_departed: "in_transit",
  courier_at_pickup: "in_transit",
  parcel_picked_up: "in_transit",
  courier_arrived: "in_transit",
  finished: "delivered",
  return_planned: "return_requested",
  return_courier_assigned: "return_pickup_scheduled",
  return_courier_departed: "return_pickup_scheduled",
  return_courier_picked_up: "return_pickup_scheduled",
  return_finished: "returned",
};

async function handleBorzoJob(job) {
  console.log('[worker] processing job:', job.type);
  
  switch (job.type) {
    case "calculate":
      const result = await borzoService.calculatePrice(job.payload);
      console.log("[worker] price result:", JSON.stringify(result, null, 2));
      if (job.meta?.clientSocketId) {
        emitToClient(job.meta.clientSocketId, {
          type: 'price_calculated',
          data: result
        });
      }
      console.log('[worker] price calculated and sent via websocket');
      break;

    case "createDirectOrder": {
      // Direct order creation (not tied to a booking)
      const order = await borzoService.createOrder(job.payload);
      console.log('[worker] direct order created:', order.order?.order_id);
      
      if (job.meta?.clientSocketId) {
        emitToClient(job.meta.clientSocketId, {
          type: 'order_created',
          data: order
        });
      }
      break;
    }

    case "create":
    case "createShipment": {
      if (!job.bookingId) throw new Error("bookingId missing");
      const booking = await RentalBooking.findById(job.bookingId).populate("instrument_id owner_shop_id");
      if (!booking) throw new Error("Booking not found");

      const borzoPayload = {
        type: "standard",
        matter: `Rental: ${booking.instrument_id?.name}`,
        vehicle_type_id: 8,
        total_weight_kg: booking.instrument_id?.shipping_details?.weight_kg || 15,
        is_route_optimizer_enabled: true,
        points: [
          {
            address: booking.shop?.pickup_address || "Test Shop Address, Pune - 411001",
            contact_person: {
              phone: booking.shop?.contact_person?.phone || "+919175668567",
              name: booking.shop?.contact_person?.name || "Shop Owner"
            },
            required_start_datetime: "2025-09-15T12:00:00+05:30",
            required_finish_datetime: "2025-09-15T18:00:00+05:30"
          },
          {
            address: booking.customer?.address || "Katraj, Pune - 411046",
            contact_person: {
              phone: booking.customer?.phone || "+919175668567",
              name: booking.customer?.name || "Customer"
            }
          }
        ]
      };

      // Call createOrder instead of createShipment (they do the same thing)
      const shipment = await borzoService.createOrder(borzoPayload);

      booking.shipment = {
        borzo_order_id: shipment.order?.order_id,
        awb: shipment.order?.order_name,
        label_url: shipment.order?.waybill_document_url,
        scheduled_pickup_slot: shipment.order?.points?.[0]?.estimated_arrival_datetime,
        tracking_status: shipment.order?.status,
        last_tracked_at: new Date()
      };
      booking.status = "ready_to_ship";
      await booking.save();
      console.log('[worker] shipment created for booking', booking._id.toString());
      
      if (shipment.order?.order_id) {
        await publishJob(
          "borzo_tracking",
          { bookingId: booking._id.toString(), borzo_order_id: shipment.order.order_id }
        );
        console.log('[worker] tracking job enqueued for order', shipment.order.order_id);
      }
      break;
    }

    default:
      console.warn("[worker] unknown job type:", job.type);
  }
}

async function handleTrackingJob(job) {
  const { borzo_order_id, bookingId } = job;
  console.log('[tracker] processing tracking for order:', borzo_order_id);

  try {
    const tracking = await borzoServiceTracker.getOrderStatus(borzo_order_id);
    console.log('[tracker] fetched tracking data:', tracking);
    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return;

    const mappedStatus = statusMap[tracking.status];
    if (mappedStatus && booking.status !== mappedStatus) {
      booking.status = mappedStatus;
      booking.shipment.tracking_status = tracking.status;
      booking.shipment.last_tracked_at = new Date();
      await booking.save();

      emitToClient(booking.user_id.toString(), {
        type: "tracking_update",
        data: {
          bookingId: booking._id,
          status: mappedStatus,
          rawStatus: tracking.status,
        }
      });

      console.log(`[tracker] Booking ${booking._id} updated to ${mappedStatus}`);
    }
  } catch (err) {
    console.error("[tracker] Error polling Borzo order:", err.message);
  }
}

async function start() {
  try {
    await connectDB();
    await connectRabbit();
    
    // Start consuming both queues
    await consumeJobs(process.env.RABBIT_QUEUE || "borzo_jobs", handleBorzoJob);
    await consumeJobs("borzo_tracking", handleTrackingJob);
    
    console.log('[worker] ready to process all job types');
  } catch (err) {
    console.error("Failed to start worker:", err);
    process.exit(1);
  }
}

start().catch(err => {
  console.error("Worker failed:", err);
  process.exit(1);
});