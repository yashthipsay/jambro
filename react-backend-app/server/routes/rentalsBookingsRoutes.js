// src/routes/bookingsRoutes.js
const router = require('express').Router();
const ctrl = require('../controllers/bookingsController');

// Public/user flows
router.post('/', ctrl.createBookingAndOrder);
router.get('/:id', ctrl.getBooking);
router.post('/:id/return-request', ctrl.requestReturn);

// Admin flows
router.post('/:id/approve', ctrl.adminApproveBooking);
router.post('/:id/shipment', ctrl.createShipment);
router.post('/:id/pickup', ctrl.schedulePickup);
router.post('/:id/refund-deposit', ctrl.refundDeposit);

// Tracking
router.get('/:id/track', ctrl.getTracking);

// Socket.io ticket (optional): return token/room data
router.get('/:id/ws-ticket', ctrl.getWsTicket);

module.exports = router;
