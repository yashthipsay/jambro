const mongoose = require('mongoose');

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
    enum: ['NOT_STARTED', 'ONGOING', 'COMPLETED'],
    default: 'NOT_STARTED'
  },
  totalAmount: {
    type: Number,
    required: false
  }
}, { timestamps: true }); // Add timestamps for createdAt and updatedAt

const BookingSchema = mongoose.model('Booking', bookingSchema);

module.exports = BookingSchema;
