const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobileNumber: {
    type: String,
    required: false,
  },
  bookings: [
    {
      jamRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'JamRoom' },
      date: { type: Date, required: true },
      slots: [
        {
          slotId: { type: Number, required: true },
          startTime: { type: String, required: true },
          endTime: { type: String, required: true },
        },
      ],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
