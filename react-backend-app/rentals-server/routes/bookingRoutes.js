import express from "express";
import * as bookingController from "../controllers/bookingController.js";

const router = express.Router();

router.post("/test", bookingController.createTestBooking); // Add this
router.get("/:bookingId", bookingController.getBooking);
router.post("/:bookingId/approve", bookingController.approveBooking);
router.post("/:bookingId/shipment", bookingController.createShipment);

router.post("/", bookingController.createBooking);
router.post("/scheduled", bookingController.createScheduledBooking);

// Add extend booking route
router.post("/:bookingId/extend", bookingController.extendBooking);

export default router;
