// src/controllers/bookingsController.js
const mongoose = require('mongoose');
const RentalBooking = require('../models/RentalBooking');
const RentalInstrument = require('../models/RentalInstrument');
const Shop = require('../models/Shop');
const { createOrderWithTransfers, refundDeposit } = require('../services/razorpayService');
const { createShipment, schedulePickup, trackAwb } = require('../services/delhiveryService');
const ws = require('../services/websocket');

// POST /api/bookings
exports.createBookingAndOrder = async (req, res, next) => {
  try {
    const { user_id, instrument_id, start_date, end_date, address } = req.body;

    const instrument = await RentalInstrument.findById(instrument_id).lean();
    if (!instrument || instrument.availability_status !== 'available') {
      return res.status(400).json({ error: 'Instrument not available' });
    }
    const shop = await Shop.findById(instrument.owner_shop_id).lean();
    if (!shop?.razorpay?.linked_account_id) {
      return res.status(400).json({ error: 'Shop payout not configured' });
    }

    // Price calc
    const days = Math.max(1, Math.ceil((new Date(end_date) - new Date(start_date)) / (24*3600*1000)));
    const rental_amount = days * instrument.price_per_day;
    const deposit_amount = Math.max(0, Math.round((instrument.shipping_details?.declared_value || 0) * 0.3)); // example policy

    // Create booking (payment_pending)
    const booking = await RentalBooking.create({
      user_id, instrument_id, owner_shop_id: instrument.owner_shop_id,
      rental: {
        start_date, end_date, days,
        price_per_day_snapshot: instrument.price_per_day,
        rental_amount
      },
      deposit: { amount: deposit_amount, status: 'held' },
      status: 'payment_pending',
      shipment: {}
    });

    // Razorpay Order with Route split for rental amount only
    const amountTotalPaise = (rental_amount + deposit_amount) * 100;
    const rentalAmountPaise = rental_amount * 100;

    const order = await createOrderWithTransfers({
      amountTotalPaise,
      currency: 'INR',
      receipt: `booking_${booking._id}`,
      notes: { booking_id: String(booking._id) },
      rentalAmountPaise,
      shopLinkedAccountId: shop.razorpay.linked_account_id
    });

    booking.payment.razorpay_order_id = order.id;
    booking.save();

    res.json({
      booking_id: booking._id,
      razorpay_order_id: order.id,
      amount: rental_amount + deposit_amount,
      currency: 'INR'
    });
  } catch (e) { next(e); }
};

exports.getBooking = async (req, res, next) => {
  try {
    const booking = await RentalBooking.findById(req.params.id).lean();
    if (!booking) return res.status(404).json({ error: 'Not found' });
    res.json(booking);
  } catch (e) { next(e); }
};

exports.adminApproveBooking = async (req, res, next) => {
  try {
    const booking = await RentalBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    if (booking.status !== 'paid') return res.status(400).json({ error: 'Payment not completed' });
    booking.status = 'approved';
    booking.audit?.events?.push({ by: 'admin', at: new Date(), type: 'approved' });
    await booking.save();
    ws.emitStatusChange(booking._id, { status: 'approved' });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.createShipment = async (req, res, next) => {
  try {
    const booking = await RentalBooking.findById(req.params.id).populate('owner_shop_id').populate('instrument_id');
    if (!booking) return res.status(404).json({ error: 'Not found' });
    if (!['approved','ready_to_ship'].includes(booking.status)) return res.status(400).json({ error: 'Not approved' });

    // Build pickup (shop) and drop (customer) from booking and shop data
    const shop = booking.owner_shop_id;
    const pickup = Array.isArray(shop.delhivery?.pickup_locations) ? shop.delhivery.pickup_locations[0] : shop.delhivery?.pickup_locations;
    if (!pickup) return res.status(400).json({ error: 'No pickup location configured' });

    const drop = req.body.drop || req.body.address || {}; // normalize from booking.address if stored structured

    const pkg = {
      weight_kg: booking.instrument_id.shipping_details?.weight_kg || 2,
      length_cm: booking.instrument_id.shipping_details?.length_cm || 40,
      width_cm: booking.instrument_id.shipping_details?.width_cm || 30,
      height_cm: booking.instrument_id.shipping_details?.height_cm || 10,
      declared_value: booking.instrument_id.shipping_details?.declared_value || booking.rental.rental_amount
    };

    const result = await createShipment({
      orderId: String(booking._id),
      pickup,
      drop,
      packageInfo: pkg
    });

    // Parse result per account’s response schema
    const awb = result?.packages?.[0]?.waybill || result?.waybill || '';
    const label_url = result?.label_url || '';

    booking.shipment = {
      ...booking.shipment,
      delhivery_order_id: String(booking._id),
      awb,
      label_url,
      tracking_status: 'label_generated',
      last_tracked_at: new Date()
    };
    booking.status = 'ready_to_ship';
    await booking.save();

    ws.emitShipmentUpdate(booking._id, { awb, label_url, status: 'ready_to_ship' });
    res.json({ awb, label_url });
  } catch (e) { next(e); }
};

exports.schedulePickup = async (req, res, next) => {
  try {
    const { pickup_date, time_slot } = req.body;
    const booking = await RentalBooking.findById(req.params.id).populate('owner_shop_id');
    if (!booking) return res.status(404).json({ error: 'Not found' });
    const pickupCode = booking.shipment?.pickup_location_code || booking.owner_shop_id.delhivery?.pickup_locations?.code;
    const data = await schedulePickup({ pickupCode, date: pickup_date, timeSlot: time_slot, shipmentCount: 1 });

    booking.shipment.scheduled_pickup_slot = `${pickup_date} ${time_slot}`;
    booking.status = 'pickup_scheduled';
    await booking.save();

    ws.emitStatusChange(booking._id, { status: 'pickup_scheduled', slot: booking.shipment.scheduled_pickup_slot });
    res.json({ ok: true, data });
  } catch (e) { next(e); }
};

exports.getTracking = async (req, res, next) => {
  try {
    const booking = await RentalBooking.findById(req.params.id);
    if (!booking?.shipment?.awb) return res.status(404).json({ error: 'No AWB' });
    const data = await trackAwb(booking.shipment.awb);
    res.json({ data });
  } catch (e) { next(e); }
};

exports.requestReturn = async (req, res, next) => {
  try {
    const booking = await RentalBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Not found' });
    booking.status = 'return_requested';
    await booking.save();
    ws.emitStatusChange(booking._id, { status: 'return_requested' });
    res.json({ ok: true });
  } catch (e) { next(e); }
};

exports.refundDeposit = async (req, res, next) => {
  try {
    const { amount } = req.body; // in INR
    const booking = await RentalBooking.findById(req.params.id);
    if (!booking?.payment?.razorpay_payment_id) return res.status(400).json({ error: 'Payment missing' });

    const amountPaise = Math.round((amount ?? booking.deposit.amount) * 100);
    const refund = await refundDeposit({
      paymentId: booking.payment.razorpay_payment_id,
      amountPaise,
      reverseAll: false,
      notes: { booking_id: String(booking._id), type: 'deposit_refund' }
    });

    booking.deposit.status = amountPaise === booking.deposit.amount * 100 ? 'refunded' : 'partially_refunded';
    booking.deposit.refund_id = refund.id;
    await booking.save();
    ws.emitStatusChange(booking._id, { status: booking.deposit.status, refund_id: refund.id });
    res.json({ refund });
  } catch (e) { next(e); }
};

exports.getWsTicket = async (req, res, next) => {
  res.json({ room: `booking:${req.params.id}` });
};
