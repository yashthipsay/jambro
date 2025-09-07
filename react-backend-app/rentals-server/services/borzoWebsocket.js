import WebSocket from "ws";
import RentalBooking from "../models/RentalsBooking.js";

// Maintain a map of order_token -> borzo_order_id for easy tracking
const orderTokenMap = new Map();

let ws;

export function connectBorzoWebsocket() {
  if (ws && ws.readyState === WebSocket.OPEN) return ws;

  ws = new WebSocket("wss://robotapitest-in.borzodelivery.com/ws");

  ws.on("open", () => {
    console.log("Connected to Borzo WebSocket");
    // Optionally re-subscribe to existing order tokens
    for (const [orderToken, orderId] of orderTokenMap.entries()) {
      ws.send(JSON.stringify({ order_token: orderToken }));
    }
    // Heartbeat every 60s
    setInterval(() => {
      ws.send(JSON.stringify({ heartbeat: "h" }));
    }, 60000);
  });

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data);
      await handleWebsocketMessage(msg);
    } catch (err) {
      console.error("Error processing Borzo WS message:", err);
    }
  });

  ws.on("close", () => {
    console.log("Borzo WebSocket disconnected, reconnecting...");
    setTimeout(connectBorzoWebsocket, 5000);
  });

  ws.on("error", (err) => {
    console.error("Borzo WS error:", err);
  });

  return ws;
}

// Track a new order via WebSocket
export function subscribeOrder(orderToken, borzoOrderId) {
  orderTokenMap.set(orderToken, borzoOrderId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ order_token: orderToken }));
  }
}

// Handle incoming messages
async function handleWebsocketMessage(message) {
  const { order_id, status } = message || {};
  if (!order_id) return;

  // Find booking with matching Borzo order ID
  const booking = await RentalBooking.findOne({ "shipment.borzo_order_id": order_id });
  if (!booking) return;

  // Map Borzo statuses to booking statuses
  const statusMap = {
    "pending": "ready_to_ship",
    "active": "pickup_scheduled",
    "in_transit": "in_transit",
    "delivered": "delivered",
    "return_requested": "return_pickup_scheduled",
    "returned": "returned"
  };

  const newStatus = statusMap[status];
  if (newStatus) {
    booking.status = newStatus;
    booking.shipment.tracking_status = status;
    booking.shipment.last_tracked_at = new Date();
    await booking.save();
    console.log(`Booking ${booking._id} updated to status: ${newStatus}`);
  }
}

// Initialize on app start
connectBorzoWebsocket();
