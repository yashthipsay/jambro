const express = require('express');
const router = express.Router();
const {createBooking, getAllBookings, getBookingsByJamRoomId, getUserDataFromBooking, getBookingsByUserId} = require('../controller/bookingController');

router.post('/', createBooking);
router.get('/', getAllBookings);
router.get('/jamroom/:jamRoomId', getBookingsByJamRoomId);
router.get('/user/:bookingId', getUserDataFromBooking);
router.get('/users/:userId', getBookingsByUserId);

module.exports = router;