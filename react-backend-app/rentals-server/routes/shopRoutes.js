import express from "express";
import * as shopController from "../controllers/shopController.js";

const router = express.Router();

router.post("/", shopController.createShop);
router.get("/", shopController.getShops);
router.get("/:shopId", shopController.getShop);

export default router;