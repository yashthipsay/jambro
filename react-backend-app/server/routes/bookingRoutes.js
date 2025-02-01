const express = require('express');
const router = express.Router();
const {createBooking, getAllBookings, getBookingsByJamRoomId, getUserDataFromBooking} = require('../controller/bookingController');

router.post('/', createBooking);
router.get('/', getAllBookings);
router.get('/jamroom/:jamRoomId', getBookingsByJamRoomId);
router.get('/user/:bookingId', getUserDataFromBooking);

module.exports = router;