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

const sampleSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  artist: {
    type: String,
    required: true,
  },
  genre: {
    type: String,
    required: true,
  },
  recordedDate: {
    type: Date,
    required: true,
  },
  audioUrl: {
    type: String,
    required: true,
  },
  description: String,
  credits: [
    {
      role: String,
      name: String,
    },
  ],
});

const recordingStudioSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["JAMROOM", "RECORDING_STUDIO"],
    default: "RECORDING_STUDIO",
    required: true,
  },
  studioDetails: {
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
    type: [String],
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
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
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
    type: Object,
  },
  addons: [addonSchema],
  // New field for recording studio portfolio
  portfolioSamples: [sampleSchema],
});

const RecordingStudio = mongoose.model(
  "RecordingStudio",
  recordingStudioSchema
);

module.exports = RecordingStudio;
