import express from "express";
import * as borzoController from "../controllers/borzoController.js";

const router = express.Router();

router.post("/calculatePrice", borzoController.calculatePrice);
router.post("/createOrder", borzoController.createBorzoOrder);
router.get("/tracking/:orderId", borzoController.getTracking);
router.post("/return/:orderId", borzoController.requestReturn);

export default router;
