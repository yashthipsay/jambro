const mongoose = require('mongoose');

const refundDetailsSchema = new mongoose.Schema({
  amount: Number,
  percentage: Number,
  processedAt: Date,
  razorpayRefundId: String
});

const bookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  jamRoom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JamRoom',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  slots: [{
    slotId: { type: Number, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  }],
  status: {
    type: String,
    enum: ['NOT_STARTED', 'ONGOING', 'COMPLETED', 'TERMINATED'],
    default: 'NOT_STARTED'
  },
  totalAmount: {
    type: Number,
    required: false
  },
  refundDetails: refundDetailsSchema,
  paymentId: {
    type: String,
    required: true,
  },
}, { timestamps: true }); // Add timestamps for createdAt and updatedAt

const BookingSchema = mongoose.model('Booking', bookingSchema);

module.exports = BookingSchema;
