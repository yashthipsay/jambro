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
  courier_assigned: "courier_assigned",
  courier_departed: "courier_departed",
  courier_at_pickup: "courier_arrived_for_pickup",
  parcel_picked_up: "in_transit",
  courier_arrived: "courier_arrived_for_delivery",
  finished: "delivered",
  return_planned: "return_courier_assigned",
  return_courier_assigned: "delivery_reattempt_assigned",
  return_courier_departed: "return_courier_departed",
  return_courier_picked_up: "return_in_transit",
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
      const booking = await RentalBooking.findById(job.bookingId)
        .populate("instrument_id")
        .populate("owner_shop_id");
      if (!booking) throw new Error("Booking not found");

      // Extract payload from job or use booking details as fallback
      const payload = job.payload || {};
      console.log('[worker] pickup address:', payload.pickup_address || booking.owner_shop_id?.pickup_address);
     const borzoPayload = {
       type: payload.type || "standard",
       matter: payload.matter || `Rental: ${booking.instrument_id?.name}`,
       vehicle_type_id: payload.vehicle_type_id || 8,
       total_weight_kg: payload.total_weight_kg || booking.instrument_id?.shipping_details?.weight_kg || 15,
       is_route_optimizer_enabled: payload.is_route_optimizer_enabled ?? true,
       points: [
         {
           address: booking.shop?.pickup_address || payload.pickup_address || "Test Shop Address, Pune - 411001",
           contact_person: {
             phone: booking.shop?.contact_person?.phone || payload.pickup_phone || "+919175668567",
             name: booking.shop?.contact_person?.name || payload.pickup_name || "Shop Owner"
           },
           required_start_datetime: payload.pickup_start_time || "2025-09-18T10:00:00+05:30",
           required_finish_datetime: payload.pickup_end_time || "2025-09-18T18:00:00+05:30"
         },
         {
           address: booking.customer?.address || payload.delivery_address || "Katraj, Pune - 411046",
           contact_person: {
             phone: booking.customer?.phone || payload.delivery_phone || "+919175668567",
             name: booking.customer?.name || payload.delivery_name || "Customer"
           }
         }
       ]
     };

      console.log('[worker] creating Borzo shipment with payload:', JSON.stringify(borzoPayload, null, 2));

      // Validate required fields
      const requiredFields = ['address', 'contact_person.phone', 'contact_person.name'];
      for (const point of borzoPayload.points) {
        for (const field of requiredFields) {
          const value = field.split('.').reduce((obj, key) => obj?.[key], point);
          if (!value) {
            throw new Error(`Missing required field: ${field} for ${point === borzoPayload.points[0] ? 'pickup' : 'delivery'} point`);
          }
        }
      }

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

      if (job.meta?.clientSocketId) {
        emitToClient(job.meta.clientSocketId, {
          type: 'shipment_created',
          data: {
            bookingId: booking._id,
            shipment: booking.shipment
          }
        });
      }

      // Queue tracking job
      if (shipment.order?.order_id) {
        await publishJob(
          "borzo_tracking",
          { bookingId: booking._id.toString(), borzo_order_id: shipment.order.order_id }
        );
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
    const trackingResponse = await borzoServiceTracker.getOrderStatus(borzo_order_id);

    if (!trackingResponse.is_successful || !trackingResponse.orders?.length) {
      console.warn('[tracker] No valid tracking data for order:', borzo_order_id);
      return;
    }

    const order = trackingResponse.orders[0];
    const orderStatus = order.status;
    const deliveryStatuses = order.points
      ?.map(p => p.delivery?.status)
      .filter(Boolean) || [];

    console.log('[tracker] Order status:', orderStatus, 'Delivery statuses:', deliveryStatuses);

    // Map Borzo → internal booking statuses
    const orderStatusMap = {
      new: "new",
      available: "ready_to_ship",
      active: "in_transit",
      completed: "delivered",
      canceled: "canceled",
      delayed: "delayed"
    };

    const deliveryStatusMap = {
      planned: "pickup_scheduled",
      courier_assigned: "pickup_assigned",
      courier_departed: "pickup_enroute",
      courier_at_pickup: "pickup_arrived",
      rider_not_assigned: "rider_unassigned",
      parcel_picked_up: "in_transit",
      active: "in_transit",
      courier_arrived: "out_for_delivery",
      finished: "delivered",
      return_planned: "return_scheduled",
      return_courier_assigned: "return_assigned",
      return_courier_departed: "return_enroute",
      return_courier_picked_up: "return_in_transit",
      return_finished: "returned",
      canceled: "canceled",
      delayed: "delayed"
    };

    // Pick the most relevant status: prefer delivery if exists, else order
    const mostRelevantStatus =
      deliveryStatuses.find(s => deliveryStatusMap[s]) || orderStatus;

    const mappedStatus =
      deliveryStatusMap[mostRelevantStatus] || orderStatusMap[mostRelevantStatus];

    if (!mappedStatus) {
      console.warn('[tracker] Unmapped status:', mostRelevantStatus);
      return;
    }

    // Update booking
    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return;

    if (booking.status !== mappedStatus) {
      booking.status = mappedStatus;
      booking.shipment.tracking_status = mostRelevantStatus;
      booking.shipment.last_tracked_at = new Date();
      await booking.save();

      emitToClient(booking.user_id.toString(), {
        type: "tracking_update",
        data: {
          bookingId: booking._id,
          status: mappedStatus,
          rawStatus: mostRelevantStatus,
        },
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