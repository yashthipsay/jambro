import express from "express";
import { 
  linkAccount, 
  updateLinkedAccount,
  fetchLinkedAccount,
  checkAccountStatus,
  createOrder, 
  verifyPayment,
  getTransfers,
  updateBankDetails
} from "../controllers/razorpayController.js";
import Razorpay from "razorpay";

const router = express.Router();
// Linked Account Management (Admin)
router.post("/admin/link-account", linkAccount);
router.patch("/admin/linked-accounts/:account_id", updateLinkedAccount);
router.post('/admin/update-bank-details/:account_id', updateBankDetails);
router.get("/admin/linked-accounts/:account_id", fetchLinkedAccount);
router.get("/admin/linked-accounts/:account_id/status", checkAccountStatus);

// Orders & Payments
router.post("/create-order", createOrder);
router.post("/verify-payment", verifyPayment);
router.get("/transfers/:payment_id", getTransfers);

export default router;