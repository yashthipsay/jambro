import express from "express";
import * as shopController from "../controllers/shopController.js";

const router = express.Router();

router.post("/", shopController.createShop);
router.get("/", shopController.getShops);
router.get("/:shopId", shopController.getShop);

// Add, modify, delete instruments
router.post("/:shopId/instruments", shopController.addInstrument);
router.put("/:shopId/instruments/:instrumentId", shopController.updateInstrument);
router.delete("/:shopId/instruments/:instrumentId", shopController.deleteInstrument);

export default router;