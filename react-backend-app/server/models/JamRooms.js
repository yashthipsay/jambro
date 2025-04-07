const mongoose = require("mongoose");

const validateContact = (contact) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{10}$/;
  return emailRegex.test(contact) || phoneRegex.test(contact);
};
const addonSchema = new mongoose.Schema({
  instrumentType: {
    type: Array,
  },
  quantity: {
    type: Number,
    min: 0,
  },
  pricePerHour: {
    type: Number,
    min: 0,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

// Create a schema for service sub-parts
const serviceSubPartSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  description: String,
  price: {
    type: Number,
  },
});

// Create a schema for studio services
const studioServiceSchema = new mongoose.Schema({
  serviceName: {
    type: String,
    required: true,
  },
  description: String,
  category: {
    type: String,
    required: true,
  },
  subParts: [serviceSubPartSchema],
});

const jamRoomSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["Jamroom", "Studio"],
  },
  jamRoomDetails: {
    name: { type: String, required: true },
    description: { type: String, required: true },
  },
  ownerDetails: {
    fullname: { type: String, required: true },
    email: {
      type: String,
      required: true,
      validate: [validateContact, "Please enter a valid email"],
    },
    phone: {
      type: String,
      required: true,
      validate: [validateContact, "Please enter a valid phone number"],
    },
    oneSignalUserId: { type: String },
    spotify: {
      username: String,
      displayName: String,
      profileUrl: String,
      followers: Number,
      images: [
        {
          url: String,
          height: Number,
          width: Number,
        },
      ],
      isVerified: {
        type: Boolean,
        default: false,
      },
      verifiedAt: Date,
    },
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
      endTime: { type: String, required: true }, // e.g., "10:00"
      isBooked: { type: Boolean, default: false },
      bookedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
      },
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
  // Add one more feature, addons, where the owner can display equipments for rent for a live jamming session.
  addons: [addonSchema],
  studioServices: {
    type: [studioServiceSchema],
    default: [],
  },
});

const JamRoom = mongoose.model("JamRoom", jamRoomSchema);

module.exports = JamRoom;
