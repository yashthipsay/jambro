// Create a payout using the post request: https://api.razorpay.com/v1/payouts
const axios = require('axios');
const {v4: uuidv4} = require('uuid');
const instance = require('../utils/razorpayInstance');
const Razorpay = require('razorpay');
async function createRazorpayPayout(req, res) {
    try {
      const { fund_account_id, amount, purpose } = req.body;
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
          reference_id: 'Gigsaw Jamroom Partner',
          narration: 'Payout for jamroom booking',
          notes: {
            notes_key_1: 'Tea, Earl Grey, Hot',
            notes_key_2: 'Tea, Earl Grey… decaf.',
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
      res.json(response.data);
    } catch (error) {
      console.error('Error creating payout:', error.message);
      if (error.response) {
        console.error('Additional error details:', error.response.data);
      }
      res.status(500).json({ error: 'Payout failed', message: error.message });
    }
  }

  async function createRefund(req, res) {
    try{

        const {paymentId} = req.body;

        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_API_KEY,
            key_secret: process.env.RAZORPAY_API_SECRET,
          });
          
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