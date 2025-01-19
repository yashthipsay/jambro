const express = require('express');
const router = express.Router();
const {createRazorpayPayout, createRefund} = require('../controller/payoutsController');

router.post('/create-payout', createRazorpayPayout);
router.post('/refund', createRefund);

module.exports = router;