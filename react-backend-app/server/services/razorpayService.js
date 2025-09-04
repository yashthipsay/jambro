const rp = require('../utils/razorpayInstance');

// Create an order with Route transfers: rental routed to shop; deposit retained by platform
async function createOrderWithTransfers({ amountTotalPaise, currency, receipt, notes, rentalAmountPaise, shopLinkedAccountId }) {
  const orderBody = {
    amount: amountTotalPaise,
    currency: currency || 'INR',
    receipt,
    notes,
    partial_payment: false,
    transfers: [
      {
        account: shopLinkedAccountId,
        amount: rentalAmountPaise,
        currency: 'INR',
        on_hold: false
      }
    ]
  };
  const { data } = await rp.post('/orders', orderBody);
  return data;
}

// Refund deposit amount only (in paise) against payment_id
async function refundDeposit({ paymentId, amountPaise, reverseAll = false, notes }) {
  const { data } = await rp.post(`/payments/${paymentId}/refund`, {
    amount: amountPaise,
    reverse_all: reverseAll,
    notes
  });
  return data;
}

module.exports = { createOrderWithTransfers, refundDeposit };