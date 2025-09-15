// src/controllers/bookingController.js
import RentalBooking from "../models/RentalsBooking.js";
import RentalInstrument from "../models/RentalInstruments.js";
import RentalShop from "../models/RentalsShops.js";
import borzoService from "../services/borzoService.js";
import { publishJob } from "../services/rabbitmq.js";
import { ObjectId } from "mongodb";

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

// Add this function to create a test booking
export const createTestBooking = async (req, res) => {
  try {
    // Create test shop first
    const testShop = new RentalShop({
      name: "Test Music Shop",
      contact: {
        name: "Shop Owner",
        phone: "+919175668567",
        email: "shop@test.com"
      }
    });
    await testShop.save();

    // Create test instrument
    const testInstrument = new RentalInstrument({
      owner_shop_id: testShop._id,
      name: "Drum Set",
      type: "Percussion",
      price_per_day: 100,
      description: "Professional drum set for rental",
      shipping_details: {
        weight_kg: 15,
        fragile: true,
        declared_value: 50000
      }
    });
    await testInstrument.save();

    // Create booking
    const booking = new RentalBooking({
      user_id: new ObjectId("507f1f77bcf86cd799439012"), // fake user ID
      instrument_id: testInstrument._id,
      owner_shop_id: testShop._id,
      rental: {
        start_date: new Date(),
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        days: 7,
        price_per_day_snapshot: 100,
        rental_amount: 700
      },
      status: "approved",
      customer: {
        name: "Test Customer",
        phone: "+919175668567",
        address: "Katraj, Pune - 411046"
      },
      shop: {
        pickup_address: "Test Shop Address, Pune - 411001",
        contact_person: { name: "Shop Owner", phone: "+919175668567" }
      }
    });
    
    await booking.save();
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createBooking = async (req, res) => {
  try {
    const {userId, 
      instrumentId,
      startDate,
      shopId,
      endDate,
      customerDetails
    } = req.body;

    // Find the instrument with the instrument id
    const instrument = await RentalInstrument.findById(instrumentId);
    if (!instrument) return res.status(404).json({ error: "Instrument not found" });

    const shop = await RentalShop.findById(shopId);
    if (!shop) return res.status(404).json({ error: "Shop not found" });

    // Create booking with initial state
    const booking = new RentalBooking({
      user_id: userId,
      instrument_id: instrumentId,
      owner_shop_id: instrument.owner_shop_id,
      rental: {
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        days: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)),
        price_per_day_snapshot: instrument.price_per_day,
        rental_amount: Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) * instrument.price_per_day
      },
      status: "pending",
      customer: {
        name: customerDetails.name,
        phone: customerDetails.phone,
        address: customerDetails.address
      },
      shop: {
        pickup_address: shop.pickup_address,
        contact_person: shop.contact
      }
    });
    await booking.save();
 
    // 2. Queue async operations (Borzo shipment creation)
    await publishJob("borzo_jobs", {
      type: "createShipment",
      bookingId: booking._id.toString(),
      meta: { 
        clientSocketId: req.body.clientSocketId 
      }
    });

    // 3. Return immediate response
    res.status(201).json({
      success: true,
      booking: booking._id,
      message: "Booking created, shipment being arranged"
    });


  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ error: err.message });

    }
  
}

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
