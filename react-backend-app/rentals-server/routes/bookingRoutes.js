import express from "express";
import * as bookingController from "../controllers/bookingController.js";

const router = express.Router();

router.post("/test", bookingController.createTestBooking); // Add this
router.get("/:bookingId", bookingController.getBooking);
router.post("/:bookingId/approve", bookingController.approveBooking);
router.post("/:bookingId/shipment", bookingController.createShipment);

export default router;
