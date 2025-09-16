import mongoose from 'mongoose';
const { Schema } = mongoose;

const rentalShopSchema = new Schema({
  name: { type: String, required: true },
  pickup_address: { type: String },
  legal_name: String,
  contact: {
    name: String,
    phone: String,
    email: String,
  },
  kyc: {
    business_type: String,
    pan: String,
    gstin: String,
    address_proof_type: String,
    address_proof_url: String,
    signatory_name: String,
    signatory_id_doc_url: String,
    verification_status: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  },
  bank: {
    account_holder: String,
    account_number: String,
    ifsc: String,
    cancelled_cheque_url: String,
  },
  razorpay: {
    linked_account_id: String,
    // current overall account status on Razorpay
    status: String,
    // details we store at creation/update time
    account_details: {
      legal_business_name: String,
      contact_name: String,
      email: String,
      phone: String,
      status: String,
      created_at: Date,
      updated_at: Date
    },
    // route product activation details
    route_config: {
      product_id: String,
      status: String,
      error: String,
      // Add bank verification status
      bank_details_verified: Boolean,
      bank_verification_error: String,
      bank_verified_at: Date
    },
    // last time we polled Razorpay for status
    last_status_check: Date
  },
  borzo: {
    client_code: String,
    pickup_locations: [{ code: String, name: String, address: String, city: String, state: String, pincode: String, contact_name: String, contact_phone: String }],
    label_print_prefs: Object,
  },
  compliance: { documents: [{ type: { type: String }, url: String }], last_reviewed_at: Date, notes: String },
  settings: { return_policy: String, damage_policy: String, deposit_policy: String },
}, { timestamps: true });

export default mongoose.model('Shop', rentalShopSchema);
