const mongoose = require('mongoose');

// Example schema
const payoutSchema = new mongoose.Schema({
    fund_account_id: String,
    amount: Number,
    currency: String,
    bulkpeTransactionId: String,
    beneficiaryName: String,
    upiId: String,
    reference_id: String,
    razorpayPayoutId: String,
    bookingId: String,
    status: { type: String, default: 'PENDING' },
    jamroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'JamRoom'
      },
    createdAt: { type: Date, default: Date.now },
  });

  const Payouts = mongoose.model('Payouts', payoutSchema);
  module.exports = Payouts;