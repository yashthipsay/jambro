// src/controllers/bookingController.js
import RentalBooking from "../models/RentalsBooking.js";
import borzoService from "../services/borzoService.js";
import { publishJob } from "../services/rabbitmq.js";

// Get booking by ID
export const getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await RentalBooking.findById(bookingId)
      .populate("instrument_id")
      .populate("owner_shop_id");
    if (!booking) return res.status(404).json({ error: "Booking not found" });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Admin approval of booking + schedule Borzo shipment
export const approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await RentalBooking.findById(bookingId).populate("instrument_id owner_shop_id");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Move booking to approved
    booking.status = "approved";
    await booking.save();

    // Publish job to RabbitMQ to create Borzo shipment
    const payload = {
      type: "createShipment",
      bookingId: booking._id.toString(),
      pickup_address: booking.owner_shop_id?.pickup_address,
      customer_address: booking.customer?.address,
      matter: `Rental: ${booking.instrument_id?.name}`,
      weight_kg: booking.instrument_id?.shipping_details?.weight_kg,
      meta: { clientSocketId: req.body.clientSocketId || null }
    };
    await publishJob(process.env.RABBIT_QUEUE, payload);

    res.json({ success: true, booking, queuedShipment: true });
  } catch (err) {
    console.error("Error approving booking:", err);
    res.status(500).json({ error: err.message });
  }
};

// Create shipment after booking approval (Borzo)
export const createShipment = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await RentalBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const shipment = await borzoService.createShipment({
      pickup_address: booking.owner_shop_id.pickup_address,
      customer_address: booking.customer.address,
      matter: `Rental: ${booking.instrument_id.name}`,
      weight_kg: booking.instrument_id.shipping_details.weight_kg,
    });

    booking.shipment = {
      borzo_order_id: shipment.order_id,
      awb: shipment.awb,
      label_url: shipment.label_url,
      scheduled_pickup_slot: shipment.scheduled_slot,
      tracking_status: shipment.status,
    };
    booking.status = "ready_to_ship";
    await booking.save();

    res.json({ success: true, shipment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const requestReturn = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await RentalBooking.findById(bookingId).populate("instrument_id owner_shop_id");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // Trigger Borzo return pickup
    const returnShipment = await borzoService.requestReturn({
      borzo_order_id: booking.shipment.borzo_order_id,
      pickup_address: booking.customer.address,
      matter: `Return: ${booking.instrument_id.name}`,
      weight_kg: booking.instrument_id.shipping_details.weight_kg
    });

    booking.return_shipment = {
      borzo_return_order_id: returnShipment.order_id,
      awb: returnShipment.awb,
      pickup_slot: returnShipment.scheduled_slot,
      tracking_status: returnShipment.status
    };

    booking.status = "return_pickup_scheduled";
    await booking.save();

    res.json({ success: true, returnShipment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const refundDepositController = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { amount } = req.body; // optional partial refund

    const refund = await refundDeposit(bookingId, amount);
    res.json({ success: true, refund });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
