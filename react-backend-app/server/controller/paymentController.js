const {instance} = require('../utils/razorpayInstance');
const crypto = require('crypto');
const checkout = async (req, res) => {

    const {amount} = req.body;
    const options = {
        amount: Number(amount * 100), 
        currency: "INR",
        receipt: "receipt#1",
    }
    const order = await instance.orders.create(options);
    console.log(order);
    res.status(200).json({ success: true, order: order});
}

const paymentVerification = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = process.env.RAZORPAY_API_SECRET;

      // Create the expected signature
  const generated_signature = crypto
  .createHmac('sha256', secret)
  .update(razorpay_order_id + '|' + razorpay_payment_id)
  .digest('hex');

    // Compare the generated signature with the received signature
    if (generated_signature === razorpay_signature) {
        // Payment is successful
        res.status(200).json({
          success: true,
          message: 'Payment verified successfully',
        });
      } else {
        // Payment verification failed
        res.status(400).json({
          success: false,
          message: 'Payment verification failed',
        });
      }
    
}
module.exports = {checkout, paymentVerification}