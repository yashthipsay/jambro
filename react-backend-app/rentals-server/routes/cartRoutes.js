import express from "express";
import CartController from "../controllers/cartController.js";
const router = express.Router();

// Load cart
router.get("/:userId", CartController.loadCart);

// Sync cart (full replace or merge)
router.post("/:userId/sync", CartController.syncCart);

// Add item to cart
router.post("/:userId/add", CartController.addItem);

// Remove item from cart
router.delete("/:userId/items/:instrumentId", CartController.removeItem);

// Update cart item
router.put("/:userId/items/:instrumentId", CartController.updateItem);

// Clear entire cart
router.delete("/:userId/clear", CartController.clearCart);

export default router;
