const express = require('express');
const router = express.Router();
const {createBulkPePayout, cancelBookingAndCreateRefund, getPayoutsByFundAccountId} = require('../controller/payoutsController');

router.post('/create-payout', createBulkPePayout);
router.post('/refund', cancelBookingAndCreateRefund);
router.get('/:fund_account_id', getPayoutsByFundAccountId);

module.exports = router;