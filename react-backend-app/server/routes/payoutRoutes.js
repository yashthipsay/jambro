const express = require('express');
const router = express.Router();
const {createBulkPePayout, cancelBookingAndCreateRefund, getPayoutsByJamRoomId} = require('../controller/payoutsController');

router.post('/create-payout', createBulkPePayout);
router.post('/refund', cancelBookingAndCreateRefund);
router.get('/:jamroom_id', getPayoutsByJamRoomId);

module.exports = router;