// src/controllers/borzoController.js
import { publishJob } from "../services/rabbitmq.js";
import borzoService from "../services/borzoService.js";

// Queue job: calculate price (with WebSocket response)
export const calculatePrice = async (req, res) => {
  const orderPayload = req.body;
  const meta = { clientSocketId: req.body.clientSocketId || null };
  
  // Queue the job for async processing
  await publishJob(process.env.RABBIT_QUEUE || "borzo_jobs", { 
    type: "calculate", 
    payload: orderPayload, 
    meta 
  });
  
  res.json({ queued: true, message: "Price calculation queued. Listen for 'price_calculated' event." });
};

// Direct calculate price (synchronous)
export const calculatePriceSync = async (req, res) => {
  try {
    const result = await borzoService.calculatePrice(req.body);
    return res.json(result);
  } catch (err) {
    console.error("calculatePrice error:", err);
    return res.status(500).json({ error: err.message });
  }
};

// Queue job: create Borzo order
export const createBorzoOrder = async (req, res) => {
  const { bookingId, clientSocketId, ...orderPayload } = req.body;
  const meta = { clientSocketId };

  // before: { type: "createShipment", bookingId, ...orderPayload, meta }
  await publishJob(
    process.env.RABBIT_QUEUE,
    {
      type: "createShipment",
      bookingId,
      payload: orderPayload,  // <- nest here
      meta
    }
  );
  
  res.json({ queued: true, message: "Order creation queued" });
};

// Add this utility function to enqueue tracking after order creation
export async function enqueueBorzoTracking(bookingId, borzo_order_id) {
  await publishJob("borzo_tracking", { bookingId, borzo_order_id });
}

// Get tracking info from Borzo
export const getTracking = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await borzoService.getTracking(orderId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Request return shipment
export const requestReturn = async (req, res) => {
  try {
    const { orderId } = req.params;
    const result = await borzoService.requestReturn(orderId);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
