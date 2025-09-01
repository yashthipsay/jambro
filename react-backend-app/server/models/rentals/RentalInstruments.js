const mongoose = require("mongoose");

const rentalsInstrumentSchema = new mongoose.Schema({
      owner_shop_id: { type: mongoose.Schema.Types.ObjectId, ref: "Shop", required: true },
  type: String,
  name: { type: String, required: true },
  description: String,
  price_per_day: { type: Number, required: true },
  images: [String],
  tags: [String],
  availability_status: { type: String, enum: ["available", "booked", "maintenance", "unavailable"], default: "available" },
  shipping_details: {
    weight_kg: Number,
    length_cm: Number,
    width_cm: Number,
    height_cm: Number,
    fragile: Boolean,
    declared_value: Number,
    hsn_code: String,
  },
  kyc_requirements: {
    requires_user_kyc: { type: Boolean, default: false },
    acceptable_docs: [String], // e.g. ["Aadhaar", "Passport", "DL"]
  },
  compliance_flags: {
    is_verified: { type: Boolean, default: false },
    notes: String,
  },
}, { timestamps: true })

module.exports = mongoose.model("RentalInstrument", rentalsInstrumentSchema);