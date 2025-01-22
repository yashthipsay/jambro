const express = require('express');
const router = express.Router();
const {createBooking, getAllBookings, getBookingsByJamRoomId} = require('../controller/bookingController');

router.post('/', createBooking);
router.get('/', getAllBookings);
router.get('/jamroom/:jamRoomId', getBookingsByJamRoomId);

module.exports = router;