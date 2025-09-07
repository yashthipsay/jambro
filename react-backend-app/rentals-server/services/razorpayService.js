import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create an order for rental + deposit
export async function createOrder({ amount, currency = "INR", receipt, notes }) {
  return razorpay.orders.create({
    amount: Math.round(amount * 100), // in paise
    currency,
    receipt,
    notes,
  });
}

const capturePaymentAndTransfer = async (paymentId, totalAmount, rentalOwnerId) => {
  try {
    // Capture the payment
    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.status !== 'captured') {
      throw new Error('Payment not captured');
    }

    // Define the split amounts
    const depositAmount = 2000; // Example deposit
    const platformFee = 1000;   // Example platform fee
    const rentalOwnerShare = totalAmount - depositAmount - platformFee;

    // Create transfers
    const transfers = [
      {
        account: process.env.PLATFORM_ACCOUNT_ID,
        amount: depositAmount * 100, // Amount in paise
        currency: 'INR',
      },
      {
        account: process.env.PLATFORM_ACCOUNT_ID,
        amount: platformFee * 100, // Amount in paise
        currency: 'INR',
      },
      {
        account: rentalOwnerId, // Rental owner's linked account ID
        amount: rentalOwnerShare * 100, // Amount in paise
        currency: 'INR',
      },
    ];

    // Initiate the transfers
    for (const transfer of transfers) {
      await razorpay.transfers.create(transfer);
    }

    console.log('Payment captured and transfers initiated successfully');
  } catch (error) {
    console.error('Error capturing payment or initiating transfers:', error);
  }
};

// Verify webhook signature
export function verifyWebhookSignature(payload, signature, secret) {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return expected === signature;
}

// Refund deposit
export async function refundPayment(paymentId, amount, notes = {}) {
  return razorpay.payments.refund(paymentId, {
    amount: amount ? Math.round(amount * 100) : undefined,
    notes,
  });
}

// Transfer rental fee to shop
export async function transferToShop({ amount, accountId, currency = "INR", notes }) {
  return razorpay.transfers.create({
    amount: Math.round(amount * 100),
    currency,
    account: accountId, // shop’s linked_account_id
    notes,
  });
}

// Refund deposit after return is delivered
export const refundDeposit = async (bookingId, refundAmount = null) => {
  const booking = await RentalBooking.findById(bookingId);
  if (!booking) throw new Error("Booking not found");

  const paymentId = booking.payment.razorpay_payment_id;
  const amountToRefund = refundAmount || booking.deposit.amount;

  const refund = await razorpay.payments.refund(paymentId, {
    amount: amountToRefund * 100, // in paise
    speed: "normal"
  });

  booking.deposit.status = refundAmount ? "partially_refunded" : "refunded";
  booking.deposit.refund_id = refund.id;
  await booking.save();

  return refund;
};

export default razorpay;
