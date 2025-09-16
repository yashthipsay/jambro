// src/controllers/bookingController.js
import RentalBooking from "../models/RentalsBooking.js";
import RentalInstrument from "../models/RentalInstruments.js";
import RentalShop from "../models/RentalsShops.js";
import borzoService from "../services/borzoService.js";
import { publishJob } from "../services/rabbitmq.js";
import { ObjectId } from "mongodb";
import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

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
    const {
      userId, 
      instrumentId,
      startDate,
      shopId,
      endDate,
      customerDetails,
      shipmentDetails 
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
      payload: {
        type: shipmentDetails?.type || "standard",
        matter: `Rental: ${instrument.name}`,
        vehicle_type_id: shipmentDetails?.vehicle_type_id || 8,
        total_weight_kg: instrument.shipping_details?.weight_kg || 15,
        is_route_optimizer_enabled: shipmentDetails?.is_route_optimizer_enabled ?? true,
        pickup_start_time: shipmentDetails?.pickup_start_time,
        pickup_end_time: shipmentDetails?.pickup_end_time,
        pickup_address: shop.pickup_address,
        pickup_phone: shop.contact?.phone,
        pickup_name: shop.contact?.name,
        delivery_address: customerDetails.address,
        delivery_phone: customerDetails.phone,
        delivery_name: customerDetails.name
      },
      meta: { 
        clientSocketId: req.body.clientSocketId 
      }
    });

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

export const createScheduledBooking = async (req, res) => {
  try {
    const {
      userId,
      instrumentId,
      startDate,    // Comes in as IST string
      endDate,      // Comes in as IST string
      shopId,
      customerDetails,
      shipmentDetails
    } = req.body;

    console.log("[createScheduledBooking] Raw startDate:", startDate);
    console.log("[createScheduledBooking] Raw endDate:", endDate);

    // Convert IST → UTC
    const rentalStartDateUTC = fromZonedTime(startDate, "Asia/Kolkata");
    const rentalEndDateUTC = fromZonedTime(endDate, "Asia/Kolkata");

    console.log("[createScheduledBooking] rentalStartDateUTC:", rentalStartDateUTC.toISOString());
    console.log("[createScheduledBooking] rentalEndDateUTC:", rentalEndDateUTC.toISOString());

    // Validate future booking
    const now = new Date();
    const hoursUntilRental = (rentalStartDateUTC - now) / (1000 * 60 * 60);
    console.log("[createScheduledBooking] Now UTC:", now.toISOString());
    console.log("[createScheduledBooking] Hours until rental:", hoursUntilRental);

    if (hoursUntilRental <= 6) {
      return res.status(400).json({
        error: "Use createBooking for rentals starting within 6 hours"
      });
    }

    // Find instrument and shop
    const instrument = await RentalInstrument.findById(instrumentId);
    if (!instrument) return res.status(404).json({ error: "Instrument not found" });
    const shop = await RentalShop.findById(shopId);
    if (!shop) return res.status(404).json({ error: "Shop not found" });

    // Shipment creation time (6h before rental start)
    const shipmentCreateTime = new Date(rentalStartDateUTC);
    shipmentCreateTime.setHours(shipmentCreateTime.getHours() - 6);

    console.log("[createScheduledBooking] shipmentCreateTime (UTC):", shipmentCreateTime.toISOString());
    console.log(
      "[createScheduledBooking] shipmentCreateTime (IST):",
      formatInTimeZone(shipmentCreateTime, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ssXXX")
    );

    // Create booking
    const booking = new RentalBooking({
      user_id: userId,
      instrument_id: instrumentId,
      owner_shop_id: instrument.owner_shop_id,
      rental: {
        start_date: rentalStartDateUTC,
        end_date: rentalEndDateUTC,
        days: Math.ceil((rentalEndDateUTC - rentalStartDateUTC) / (1000 * 60 * 60 * 24)),
        price_per_day_snapshot: instrument.price_per_day,
        rental_amount:
          Math.ceil((rentalEndDateUTC - rentalStartDateUTC) / (1000 * 60 * 60 * 24)) *
          instrument.price_per_day
      },
      status: "rider_not_assigned",
      customer: {
        name: customerDetails.name,
        phone: customerDetails.phone,
        address: customerDetails.address
      },
      shop: {
        pickup_address: shop.pickup_address,
        contact_person: shop.contact
      },
      scheduled_shipment: {
        create_at: shipmentCreateTime,
        details: {
          type: shipmentDetails?.type || "standard",
          matter: `Rental: ${instrument.name}`,
          vehicle_type_id: shipmentDetails?.vehicle_type_id || 8,
          total_weight_kg: instrument.shipping_details?.weight_kg || 15,
          is_route_optimizer_enabled: shipmentDetails?.is_route_optimizer_enabled ?? true,
          pickup_address: shop.pickup_address,
          pickup_phone: shop.contact?.phone,
          pickup_name: shop.contact?.name,
          delivery_address: customerDetails.address,
          delivery_phone: customerDetails.phone,
          delivery_name: customerDetails.name,
          pickup_start_time: shipmentDetails?.pickup_start_time
            ? fromZonedTime(shipmentDetails.pickup_start_time, "Asia/Kolkata").toISOString()
            : undefined,
          pickup_end_time: shipmentDetails?.pickup_end_time
            ? fromZonedTime(shipmentDetails.pickup_end_time, "Asia/Kolkata").toISOString()
            : undefined
        }
      }
    });

    await booking.save();

    res.status(201).json({
      success: true,
      booking: booking._id,
      message: `Booking scheduled! Delivery will be arranged on ${formatInTimeZone(
        shipmentCreateTime,
        "Asia/Kolkata",
        "yyyy-MM-dd HH:mm:ssXXX"
      )}`,
      rental_start: formatInTimeZone(rentalStartDateUTC, "Asia/Kolkata", "yyyy-MM-dd HH:mm:ssXXX"),
      shipment_creation_time: formatInTimeZone(
        shipmentCreateTime,
        "Asia/Kolkata",
        "yyyy-MM-dd HH:mm:ssXXX"
      )
    });
  } catch (err) {
    console.error("Create scheduled booking error:", err);
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
