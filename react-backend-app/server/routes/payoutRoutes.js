const express = require('express');
const router = express.Router();
const {createRazorpayPayout, createRefund, getPayoutsByFundAccountId} = require('../controller/payoutsController');

router.post('/create-payout', createRazorpayPayout);
router.post('/refund', createRefund);
router.get('/:fund_account_id', getPayoutsByFundAccountId);

module.exports = router;