// Create a payout using the post request: https://api.razorpay.com/v1/payouts
const axios = require("axios");
const { v4: uuidv4 } = require("uuid");
const Razorpay = require("razorpay");
const JamRoom = require("../models/JamRooms");
const Payout = require("../models/Payouts");
const Booking = require("../models/BookingSchema");
const moment = require("moment-timezone");

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

const BULKPE_API_URL = "https://api.bulkpe.in/client";

async function createBulkPePayout(req, res) {
  try {
    const { jamroomId, amount, purpose, bookingId } = req.body;

    console.log(
      `Initiating payout for JamRoom ID: ${jamroomId}, Booking ID: ${bookingId}, Amount: ${amount}`
    );

    // 1. Fetch the jamroom
    const jamroom = await JamRoom.findById(jamroomId);
    if (!jamroom) {
      return res.status(404).json({ error: "JamRoom not found" });
    }

    if (
      !jamroom.bankValidationData.fund_account.vpa.address ||
      !jamroom.ownerDetails.fullname
    ) {
      console.error(
        `Missing UPI ID or owner name for JamRoom ID: ${jamroomId}`
      );
      return res.status(400).json({
        success: false,
        message: "Missing UPI ID or owner name in jamroom details",
      });
    }

    // Generate unique reference ID using timestamp and uuid
    const reference_id = `JAM${moment().format(
      "YYYYMMDDHHmmss"
    )}${uuidv4().slice(0, 8)}`;

    const payoutData = {
      amount: amount,
      payment_mode: "UPI",
      reference_id: reference_id,
      transcation_note: purpose || "Jamroom session payout",
      beneficiaryName: jamroom.ownerDetails.fullname,
      upi: jamroom.bankValidationData.fund_account.vpa.address, // Make sure this field exists in your JamRoom model
    };

    const response = await axios.post(
      `${BULKPE_API_URL}/initiatepayout`,
      payoutData,
      {
        headers: {
          Authorization: `Bearer ${process.env.BULKPE_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.status) {
      console.log(
        `Payout initiated successfully for reference ID: ${reference_id}`
      );
      // Create a new payout document
      let newPayout = new Payout({
        jamroom: jamroom._id,
        reference_id: reference_id,
        amount: amount,
        currency: "INR",
        status: response.data.data.status,
        bulkpeTransactionId: response.data.data.transcation_id,
        bookingId: bookingId,
        beneficiaryName: jamroom.ownerName,
        upiId: jamroom.bankValidationData.fund_account.vpa.address,
      });
      await newPayout.save();
      console.log(`Payout record saved for reference ID: ${reference_id}`);
      return res.status(200).json({
        success: true,
        data: response.data.data,
      });
    } else {
      console.error(
        `Payout initiation failed for reference ID: ${reference_id}. Response:`,
        response.data
      );
      return res.status(500).json({
        success: false,
        message: response.data.message || "Payout initiation failed",
      });
    }
  } catch (error) {
    console.error("Error creating payout:", error.message);
    if (error.response) {
      console.error("Additional error details:", error.response.data);
    }
    return res
      .status(500)
      .json({ error: "Payout failed", message: error.message });
  }
}

async function getPayoutsByJamRoomId(req, res) {
  try {
    const { jamroom_id } = req.params;
    const {
      minAmount,
      maxAmount,
      startDate,
      endDate,
      sortBy,
      sortOrder,
      skip = 0,
      limit = 10,
    } = req.query;

    const filter = { jamroom: jamroom_id };

    if (minAmount) {
      filter.amount = { ...filter.amount, $gte: Number(minAmount) };
    }

    if (maxAmount) {
      filter.amount = { ...filter.amount, $lte: Number(maxAmount) };
    }

    if (startDate) {
      filter.createdAt = { ...filter.createdAt, $gte: new Date(startDate) };
    }

    if (endDate) {
      filter.createdAt = { ...filter.createdAt, $lte: new Date(endDate) };
    }

    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;
    }
    const totalPayouts = await Payout.countDocuments(filter);
    console.log("count", totalPayouts);
    const payouts = await Payout.find(filter)
      .sort(sortOptions)
      .skip(Number(skip))
      .limit(Number(limit))
      .populate("jamroom", "jamRoomDetails.name");

    res.status(200).json({
      success: true,
      data: payouts,
      total: totalPayouts,
      hasResults: payouts.length > 0,
    });
  } catch (error) {
    console.error("Error fetching payouts:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: error.message });
  }
}

async function cancelBookingAndCreateRefund(req, res) {
  try {
    const { bookingId } = req.body;

    // 1. Fetch and validate booking
    const booking = await Booking.findById(bookingId).populate("jamRoom");
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // 2. Check if booking is already terminated
    if (booking.status === "TERMINATED") {
      return res.status(400).json({
        success: false,
        message: "Booking is already cancelled",
      });
    }

    // 3. Calculate time difference and refund amount
    const currentTime = moment().tz("Asia/Kolkata");
    const bookingDate = moment(booking.date).tz("Asia/Kolkata").startOf("day");

    // Find earliest slot
    const earliestSlot = booking.slots.reduce((earliest, slot) => {
      const slotTime = bookingDate.clone().set({
        hour: parseInt(slot.startTime.split(":")[0]),
        minute: parseInt(slot.startTime.split(":")[1]),
      });
      return earliest
        ? slotTime.isBefore(earliest)
          ? slotTime
          : earliest
        : slotTime;
    }, null);

    const timeDifference = earliestSlot.diff(currentTime, "minutes");
    let refundPercentage = 100;

    if (timeDifference < 30) {
      refundPercentage = 65;
    } else if (timeDifference < 60) {
      refundPercentage = 80;
    }

    const refundAmount = Math.floor(
      (booking.totalAmount * refundPercentage) / 100
    );

    // 5. Process refund through Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_API_KEY,
      key_secret: process.env.RAZORPAY_API_SECRET,
    });

    const refundResult = await razorpay.payments.refund(booking.paymentId, {
      amount: refundAmount * 100, // Convert to paise
      speed: "normal",
      notes: {
        notes_key_1: `Booking cancellation refund - ${refundPercentage}%`,
        notes_key_2: `Booking ID: ${booking._id}`,
        notes_key_3: `Original amount: ${booking.totalAmount}`,
        notes_key_4: `Time to booking: ${timeDifference} minutes`,
      },
    });

    // 6. Update booking status
    booking.status = "TERMINATED";
    booking.refundDetails = {
      amount: refundAmount,
      percentage: refundPercentage,
      processedAt: new Date(),
      razorpayRefundId: refundResult.id,
    };
    await booking.save();

    // 7. Return success response
    return res.status(200).json({
      success: true,
      data: {
        booking: booking._id,
        refundAmount,
        refundPercentage,
        refundId: refundResult.id,
        message: `Refund of ${refundPercentage}% (₹${refundAmount}) processed successfully`,
      },
    });
  } catch (error) {
    console.error("Refund processing error:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing refund",
      error: error.message,
    });
  }
}

module.exports = {
  createBulkPePayout,
  cancelBookingAndCreateRefund,
  getPayoutsByJamRoomId,
};
