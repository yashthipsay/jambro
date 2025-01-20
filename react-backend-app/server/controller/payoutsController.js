// Create a payout using the post request: https://api.razorpay.com/v1/payouts
const axios = require('axios');
const {v4: uuidv4} = require('uuid');
const Razorpay = require('razorpay');
const JamRoom = require('../models/JamRooms');
const Payout = require('../models/Payouts');
const Booking = require('../models/BookingSchema');

const instance = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

async function createRazorpayPayout(req, res) {
    try {
      const { jamroomId, fund_account_id, amount, purpose } = req.body;

          // 1. Fetch the jamroom
    const jamroom = await JamRoom.findById(jamroomId);
    if (!jamroom) {
      return res.status(404).json({ error: 'JamRoom not found' });
    }
        // 2. Create a new payout document (status initially 'PENDING')
        let newPayout = new Payout({
          jamroom: jamroom._id,
          reference_id: jamroom._id.toString(), // Use jamroom ID or any field
          fund_account_id,
          amount,
          currency: 'INR',
          status: 'PENDING',
        });
        await newPayout.save();

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

  async function createRefund(req, res) {
    try{

        const {paymentId} = req.body;

          
          const refundResult = await instance.payments.refund(paymentId, {
            speed: 'normal',
            notes: {
              notes_key_1: 'refund'
            },
            // No receipt here
          });
          console.log('Refund success:', refundResult);
          return res.status(200).json(refundResult);
    }catch(error){
        console.error('Error creating refund payout:', error.message);
        if (error.response) {
          console.error('Additional error details:', error.response.data);
        }
        res.status(500).json({ error: 'Refund Payout failed', message: error.message });
    }
  }

module.exports = { createRazorpayPayout, createRefund };