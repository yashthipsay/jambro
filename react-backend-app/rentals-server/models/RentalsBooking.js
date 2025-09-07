import mongoose from 'mongoose';
const { Schema } = mongoose;

const rentalBookingSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  instrument_id: { type: Schema.Types.ObjectId, ref: 'RentalInstrument', required: true },
  owner_shop_id: { type: Schema.Types.ObjectId, ref: 'Shop', required: true },

  // rental snapshot
  rental: {
    start_date: { type: Date, required: true },
    end_date: { type: Date, required: true },
    days: Number,
    price_per_day_snapshot: Number,
    rental_amount: Number,
  },

  deposit: {
    amount: Number,
    status: { type: String, enum: ['held', 'refunded', 'partially_refunded'], default: 'held' },
    refund_id: String,
  },

  payment: {
    razorpay_order_id: String,
    razorpay_payment_id: String,
    method: String,
    status: String,
    captured_at: Date,
  },

  status: {
    type: String,
    enum: [
      'pending','payment_pending','paid','approved','ready_to_ship','pickup_scheduled',
      'in_transit','delivered','return_requested','return_pickup_scheduled',
      'returned','completed','cancelled'
    ],
    default: 'pending'
  },

  // Borzo shipment details
  shipment: {
    borzo_order_id: String,
    awb: String,
    label_url: String,
    pickup_location_code: String,
    scheduled_pickup_slot: String,
    tracking_status: String,
    last_tracked_at: Date,
  },

  return_shipment: {
    borzo_return_order_id: String,
    awb: String,
    pickup_slot: String,
    tracking_status: String,
  },

  // convenience objects used by controllers / admin UI
  shop: {
    pickup_address: String,
    contact_person: { name: String, phone: String }
  },

  customer: {
    name: String,
    phone: String,
    address: String
  },

  verification_docs: [{ type: { type: String }, url: String }],

  audit: {
    created_at: { type: Date, default: Date.now },
    updated_at: Date,
    events: [{ by: String, at: Date, type: String, payload_hash: String }],
  },

}, { timestamps: true });

// Change the collection name from 'Booking' to 'rentalsBookings'
export default mongoose.model('Booking', rentalBookingSchema, 'rentalsBookings');