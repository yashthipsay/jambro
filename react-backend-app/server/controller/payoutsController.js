// Create a payout using the post request: https://api.razorpay.com/v1/payouts
const axios = require('axios');
const {v4: uuidv4} = require('uuid');
const Razorpay = require('razorpay');
const JamRoom = require('../models/JamRooms');
const Payout = require('../models/Payouts');
const Booking = require('../models/BookingSchema');
const moment = require('moment-timezone');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

async function createRazorpayPayout(req, res) {
    try {
      const { jamroomId, fund_account_id, amount, purpose, bookingId } = req.body;

          // 1. Fetch the jamroom
    const jamroom = await JamRoom.findById(jamroomId);
    if (!jamroom) {
      return res.status(404).json({ error: 'JamRoom not found' });
    }


      const idempotencyKey = uuidv4();
  
      const response = await axios.post(
        'https://api.razorpay.com/v1/payouts',
        {
          account_number: '2323230082162607',
          fund_account_id,
          amount,
          currency: 'INR',
          mode: 'UPI',
          purpose: purpose,
          queue_if_low_balance: true,
          reference_id: jamroom._id.toString(),
          narration: `Jamroom session payout`,
          notes: {
            notes_key_1: 'Jamroom session payout', //Include jamroom name here
            notes_key_2: 'user name', //Includes user name who payed for the session
            notes_key_3: 'Date', //Date of session booked,
            notes_key_4: 'Slots booked for the session' //Slots booked for the session
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Payout-Idempotency': idempotencyKey,
          },
          auth: {
            username: process.env.RAZORPAY_API_KEY,
            password: process.env.RAZORPAY_API_SECRET,
          },
        }
      );

      // 2. Create a new payout document (status initially 'PENDING')
      let newPayout = new Payout({
        jamroom: jamroom._id,
        reference_id: jamroom._id.toString(), // Use jamroom ID or any field
        fund_account_id,
        amount,
        currency: 'INR',
        status: 'PENDING',
        razorpayPayoutId: response.data.id, // Store Razorpay payout ID
        bookingId: bookingId,
      });
      await newPayout.save();
  
      console.log('Payout response:', response.data);
      return res.json(response.data);
    } catch (error) {
      console.error('Error creating payout:', error.message);
      if (error.response) {
        console.error('Additional error details:', error.response.data);
      }
      return res.status(500).json({ error: 'Payout failed', message: error.message });
    }
  }

  async function getPayoutsByFundAccountId(req, res) {
    try {
      const { fund_account_id } = req.params;
      const { minAmount, maxAmount, startDate, endDate, sortBy, sortOrder, skip = 0, limit = 10 } = req.query;

      const filter = { fund_account_id };

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
        sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
      }

      const payouts = await Payout.find(filter)
      .sort(sortOptions)
      .skip(Number(skip))
      .limit(Number(limit))

      const totalPayouts = await Payout.countDocuments(filter);
  
      res.status(200).json({ 
        success: true, 
        data: payouts, 
        total: totalPayouts,
        hasResults: payouts.length > 0 
      });
  
    } catch (error) {
      console.error('Error fetching payouts:', error);
      res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  }

  async function cancelBookingAndCreateRefund(req, res) {
    try {
      const { bookingId } = req.body;
  
      // 1. Fetch and validate booking
      const booking = await Booking.findById(bookingId).populate('jamRoom');
      if (!booking) {
        return res.status(404).json({ 
          success: false, 
          message: 'Booking not found' 
        });
      }
  
      // 2. Check if booking is already terminated
      if (booking.status === 'TERMINATED') {
        return res.status(400).json({
          success: false,
          message: 'Booking is already cancelled'
        });
      }
  
      // 3. Calculate time difference and refund amount
      const currentTime = moment().tz('Asia/Kolkata');
      const bookingDate = moment(booking.date).tz('Asia/Kolkata').startOf('day');
      
      // Find earliest slot
      const earliestSlot = booking.slots.reduce((earliest, slot) => {
        const slotTime = bookingDate.clone().set({
          hour: parseInt(slot.startTime.split(':')[0]),
          minute: parseInt(slot.startTime.split(':')[1])
        });
        return earliest ? (slotTime.isBefore(earliest) ? slotTime : earliest) : slotTime;
      }, null);
  
      const timeDifference = earliestSlot.diff(currentTime, 'minutes');
      let refundPercentage = 100;
  
      if (timeDifference < 30) {
        refundPercentage = 65;
      } else if (timeDifference < 60) {
        refundPercentage = 80;
      }
  
      const refundAmount = Math.floor((booking.totalAmount * refundPercentage) / 100);
  
  
      // 5. Process refund through Razorpay
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_API_KEY,
        key_secret: process.env.RAZORPAY_API_SECRET
      });
  
      const refundResult = await razorpay.payments.refund(booking.paymentId, {
        amount: refundAmount * 100, // Convert to paise
        speed: 'normal',
        notes: {
          notes_key_1: `Booking cancellation refund - ${refundPercentage}%`,
          notes_key_2: `Booking ID: ${booking._id}`,
          notes_key_3: `Original amount: ${booking.totalAmount}`,
          notes_key_4: `Time to booking: ${timeDifference} minutes`
        }
      });
  
      // 6. Update booking status
      booking.status = 'TERMINATED';
      booking.refundDetails = {
        amount: refundAmount,
        percentage: refundPercentage,
        processedAt: new Date(),
        razorpayRefundId: refundResult.id
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
          message: `Refund of ${refundPercentage}% (₹${refundAmount}) processed successfully`
        }
      });
  
    } catch (error) {
      console.error('Refund processing error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error processing refund',
        error: error.message
      });
    }
  }

module.exports = { createRazorpayPayout, cancelBookingAndCreateRefund, getPayoutsByFundAccountId };