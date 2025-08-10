const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    savedNumbers: {
      type: [String],
      required: false,
      default: [], // This sets an empty array as default value
      validate: {
        validator: function (numbers) {
          return numbers.every(
            (num) => !num || /^\+?([0-9]{2})?\d{10}$/.test(num)
          );
        },
        message: "Invalid phone number format",
      },
    },
    bookings: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Booking" }],
      default: [],
    },
    completedBookingsCount: { type: Number, default: 0 },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
