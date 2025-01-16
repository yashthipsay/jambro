const mongoose = require('mongoose');

const validateContact = (contact) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;
  return emailRegex.test(contact) || phoneRegex.test(contact);
};

const jamRoomSchema = new mongoose.Schema({
  jamRoomDetails: {
    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  ownerDetails: {
    fullname: { type: String, required: true },
    email: { type: String, required: true, validate: [validateContact, 'Please enter a valid email'] },
    phone: { type: String, required: true, validate: [validateContact, 'Please enter a valid phone number'] },
  },
  location: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  images: {
    type: [String], // Array of image URLs
    required: true,
  },
  bankDetails: {
    accountNumber: { type: String },
    ifscCode: { type: String },
    accountType: { type: String },
    upiAddress: { type: String },
    validationType: { type: String, required: true },
  },
  slots: [
    {
      slotId: { type: Number, required: true },
      startTime: { type: String, required: true }, // e.g., "09:00"
      endTime: { type: String, required: true },   // e.g., "10:00"
      isBooked: { type: Boolean, default: false },
      bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
  ],
  feesPerSlot: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  bankValidationData: {
    type: Object, // Data returned after bank account validation
  },
});

const JamRoom = mongoose.model('JamRoom', jamRoomSchema);

module.exports = JamRoom;
