const BookingSchema = require("../models/BookingSchema");
const JamRoom = require("../models/JamRooms");
const User = require("../models/User");
const moment = require("moment-timezone");
const {sendBookingNotification} = require("../services/notificationService");

const createBooking = async (req, res) => {
  try {
    const { userId, jamRoomId, date, slots, totalAmount, paymentId } = req.body;

    console.log("req.body:", req.body);
    // Convert date to the correct timezone
    // const bookingDate = moment(date, 'YYYY-MM-DD').toDate();
    let bookingDate = new Date(date);
    bookingDate = bookingDate.toISOString().split("T")[0];
    console.log("bookingDate:", bookingDate);

    // 1. Check if the user and jam room exist
    const user = await User.findById(userId);
    const jamRoom = await JamRoom.findById(jamRoomId);

    if (!user || !jamRoom) {
      return res
        .status(404)
        .json({ success: false, message: "User or Jam Room not found" });
    }

    // 2. Check for conflicting bookings
    const conflictingBookings = await BookingSchema.find({
      jamRoom: jamRoomId,
      date: bookingDate,
      "slots.slotId": { $in: slots.map((slot) => slot.slotId) },
    });

    if (conflictingBookings.length > 0) {
      return res.status(409).json({
        success: false,
        message: "One or more selected time slots are already booked",
      });
    }

    // 3. Create the booking
    const newBooking = new BookingSchema({
      user: userId,
      jamRoom: jamRoomId,
      date: bookingDate,
      slots,
      totalAmount,
      paymentId,
      status: "NOT_STARTED",
    });

    // 4. Save the booking
    const savedBooking = await newBooking.save();

    // 5. Send notification to the owner - handle separately from main flow
    if (jamRoom && jamRoom.ownerDetails && jamRoom.ownerDetails.oneSignalUserId) {
      try {
        console.log("Attempting to send notification to:", jamRoom.ownerDetails.oneSignalUserId);
        await sendBookingNotification({
          jamRoomId: req.body.jamRoomId,
          jamRoomName: jamRoom.jamRoomDetails.name,
          ownerOneSignalId: jamRoom.ownerDetails.oneSignalUserId,
          bookingId: newBooking._id,
          bookingDate: req.body.date,
          slots: req.body.slots
        });
        console.log("Notification sent successfully");
      } catch (notificationError) {
        // Log the error but don't fail the booking creation
        console.error("Failed to send notification:", notificationError);
        console.error("Notification error details:", notificationError.response?.data || notificationError.message);
      }
    } else {
      console.log("Skipping notification - missing OneSignal user ID");
    }

    res.status(201).json({ success: true, booking: savedBooking });
  } catch (error) {
    console.error("Error creating booking:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    const bookings = await BookingSchema.find()
      .populate("user")
      .populate("jamRoom"); // Populate user and jamRoom
    res.status(200).json({ success: true, bookings });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getBookingsByJamRoomId = async (req, res) => {
  try {
    const { jamRoomId } = req.params;
    const {
      startDate,
      endDate,
      sortBy,
      sortOrder,
      skip = 0,
      limit = 10,
    } = req.query;

    const filter = { jamRoom: jamRoomId };

    if (startDate) {
      filter.date = { ...filter.date, $gte: new Date(startDate) };
    }

    if (endDate) {
      filter.date = { ...filter.date, $lte: new Date(endDate) };
    }

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }

    const bookings = await BookingSchema.find(filter)
      .sort(sortOptions)
      .skip(Number(skip))
      .limit(Number(limit))
      .populate("user");

    const totalBookings = await BookingSchema.countDocuments(filter);

    // Always return success with data and hasResults flag
    res.status(200).json({
      success: true,
      data: bookings,
      total: totalBookings,
      hasResults: bookings.length > 0,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

const getUserDataFromBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await BookingSchema.findById(bookingId).populate("user");

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    const user = booking.user;
    const userInfo = {
      name: user.name,
      email: user.email,
      savedNumber: user.savedNumbers.length > 0 ? user.savedNumbers[0] : null,
    };

    res.status(200).json({ success: true, data: userInfo });
  } catch (error) {
    console.error("Error fetching user data from booking:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
};

// Get bookings by user ID
const getBookingsByUserId = async (req, res) => {
  try {
    console.log("req.params:", req.params);
    const { userId } = req.params;
    const bookings = await BookingSchema.find({ user: userId })
      .populate("jamRoom")
      .sort({ date: -1 }); // Sort by date descending

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching bookings by user ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  getBookingsByJamRoomId,
  getUserDataFromBooking,
  getBookingsByUserId,
};

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
