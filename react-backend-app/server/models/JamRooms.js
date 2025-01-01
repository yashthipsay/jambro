const mongoose = require('mongoose');

const jamRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const JamRoom = mongoose.model('JamRoom', jamRoomSchema);

module.exports = JamRoom;
