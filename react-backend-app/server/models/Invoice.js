const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jamRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JamRoom',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    slots: [
      {
        slotId: { type: Number, required: true },
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
    paymentId: {
      type: String,
      required: true,
    },
    addonsCost: {
      type: Number,
      default: 0
    },
    selectedAddons: [{
      addonId: String,
      instrumentType: [String],
      pricePerHour: Number,
      hours: Number
    }],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

const Invoice = mongoose.model('Invoice', invoiceSchema);

module.exports = Invoice;