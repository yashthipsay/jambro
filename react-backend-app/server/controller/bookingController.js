const BookingSchema = require('../models/BookingSchema');
const JamRoom = require('../models/JamRooms');
const User = require('../models/User');
const moment = require('moment-timezone');



const createBooking = async (req, res) => {
  try {
    const { userId, jamRoomId, date, slots, totalAmount } = req.body;

    // Convert date to the correct timezone
    const bookingDate = moment(date).tz('Asia/Kolkata').startOf('day').toDate();

    // 1. Check if the user and jam room exist
    const user = await User.findById(userId);
    const jamRoom = await JamRoom.findById(jamRoomId);

    if (!user || !jamRoom) {
      return res.status(404).json({ success: false, message: 'User or Jam Room not found' });
    }

    // 2. Check for conflicting bookings
    const conflictingBookings = await BookingSchema.find({
      jamRoom: jamRoomId,
      date: bookingDate,
      'slots.slotId': { $in: slots.map(slot => slot.slotId) },
    });

    if (conflictingBookings.length > 0) {
      return res.status(409).json({ success: false, message: 'One or more selected time slots are already booked' });
    }

    // 3. Create the booking
    const newBooking = new BookingSchema({
      user: userId,
      jamRoom: jamRoomId,
      date: bookingDate,
      slots,
      totalAmount,
      status: 'NOT_STARTED'
    });

    // 4. Save the booking
    const savedBooking = await newBooking.save();

    res.status(201).json({ success: true, booking: savedBooking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};

const getAllBookings = async (req, res) => {
    try {
      const bookings = await BookingSchema.find().populate('user').populate('jamRoom'); // Populate user and jamRoom
      res.status(200).json({ success: true, bookings });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };

module.exports = {
    createBooking,
    getAllBookings
}


// Example schema
// const payoutSchema = new mongoose.Schema({
//   fund_account_id: String,
//   amount: Number,
//   currency: String,
//   reference_id: String,
//   razorpayPayoutId: String,
//   status: { type: String, default: 'PENDING' },
//   createdAt: { type: Date, default: Date.now },
// });