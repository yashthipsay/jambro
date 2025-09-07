// src/controllers/borzoController.js
import { publishJob } from "../services/rabbitmq.js";
import borzoService from "../services/borzoService.js";

// Queue job: calculate price
export const calculatePrice = async (req, res) => {
  const orderPayload = req.body;
  const meta = { clientSocketId: req.body.clientSocketId || null };
  await publishJob(process.env.RABBIT_QUEUE || "borzo_jobs", { type: "calculate", payload: orderPayload, meta });
  res.json({ queued: true });
};

// Queue job: create Borzo order
export const createBorzoOrder = async (req, res) => {
  const orderPayload = req.body;
  const meta = { clientSocketId: req.body.clientSocketId || null };
  await publishJob(process.env.RABBIT_QUEUE || "borzo_jobs", { type: "create", payload: orderPayload, meta });
  res.json({ queued: true });
};

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
