const mongoose = require("mongoose");

const rentalShopSchema = new mongoose.Schema({
    name: { type: String, required: true },
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
        verification_status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
    },
    bank: {
        account_holder: String,
        account_number: String,
        ifsc: String,
        cancelled_cheque_url: String,
    },
    razorpay: {
        linked_account_id: String,
        status: String,
        route_config: Object,
    },
    delhivery: {
        client_code: String,
        pickup_locations: [{
        code: String,
        name: String,
        address: String,
        city: String,
        state: String,
        pincode: String,
        contact_name: String,
        contact_phone: String,
        }],
        label_print_prefs: Object,
    },
    compliance: {
        documents: [{ type: { type: String }, url: String }],
        last_reviewed_at: Date,
        notes: String,
    },
    settings: {
        return_policy: String,
        damage_policy: String,
        deposit_policy: String,
    },
}, { timestamps: true })

module.exports = mongoose.model("Shop", rentalShopSchema);