const {instance} = require('../utils/razorpayInstance');
const crypto = require('crypto');
const Invoice = require('../models/Invoice');
const User = require('../models/User');
const JamRoom = require('../models/JamRooms');
const {jsPDF} = require('jspdf');
require('dotenv').config();
const Booking = require('../models/BookingSchema');
const {createBooking} = require('./bookingController');

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
    const user = await User.findOne({ email: req.body.email });
    const jamRoom = await JamRoom.findById(req.body.jamRoomId);

    const invoice = new Invoice({
      userId: user._id,
      jamRoomId: jamRoom._id,
      date: req.body.date,
      slots: req.body.slots,
      totalAmount: req.body.totalAmount,
      paymentId: razorpay_payment_id,
    });

    await invoice.save();


    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      invoiceId: invoice._id,
    });
  } else {
    // Payment verification failed
    res.status(400).json({
      success: false,
      message: 'Payment verification failed',
    });
  }
};

const getInvoice = async (req, res) => {
  const { id } = req.params;
  const invoice = await Invoice.findById(id).populate('userId').populate('jamRoomId');

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'Invoice not found',
    });
  }

  // Generate PDF invoice
  const doc = new jsPDF();
  // Header
  doc.setFontSize(20);
  doc.text('INVOICE', 14, 20);
  
  // User Information
  doc.setFontSize(12);
  doc.text(`User: ${invoice.userId.name}`, 14, 40);
  doc.text(`Email: ${invoice.userId.email}`, 14, 50);
  
  // Jam Room Information
  doc.text(`Jam Room: ${invoice.jamRoomId.name}`, 14, 60);
  
  // Date and Invoice Number
  doc.text(`Date: ${new Date(invoice.date).toLocaleDateString()}`, 14, 70);
  doc.text(`Invoice No: ${invoice._id}`, 14, 80);

  // Line break
  doc.line(10, 85, 200, 85); // Horizontal line

  // Total Amount
  doc.setFontSize(14);
  doc.text(`Total Amount: ₹${invoice.totalAmount}`, 14, 95);

  // Slots Section
  doc.setFontSize(12);
  doc.text('Slots:', 14, 110);
  
  invoice.slots.forEach((slot, index) => {
    const slotText = `${slot.startTime} - ${slot.endTime}`;
    doc.text(slotText, 14, 120 + index * 10);
  });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150); // Grey color for footer text
  doc.text('Thank you for your business!', 14, doc.internal.pageSize.height - 30);

  const pdfBuffer = doc.output('arraybuffer');

  res.status(200).json({
    success: true,
    pdfBuffer: Buffer.from(pdfBuffer).toString('base64'),
  });
};

module.exports = {checkout, paymentVerification, getInvoice}