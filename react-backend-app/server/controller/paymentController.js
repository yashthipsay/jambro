const {instance} = require('../utils/razorpayInstance');
const checkout = async (req, res) => {

    const {amount} = req.body;
    const options = {
        amount: amount * 100,
        currency: "INR",
        receipt: "receipt#1",
    }
    const order = await instance.orders.create(options);
    console.log(order);
    res.status(200).json({ success: true, order: order});
}

const paymentVerification = async (req, res) => {
    
}
module.exports = {checkout}