import Razorpay from "razorpay";
import crypto from "crypto";
import RentalShop from "../models/RentalsShops.js";
import RentalBooking from "../models/RentalsBooking.js";
import express from "express";
import axios from "axios";

const router = express.Router();
const razorpay = new Razorpay({
  key_id: "rzp_test_w5JPLQL0wD4t6c",
  key_secret: "0jSv0hG4OmuToMYTrPkizk4P",
});

/**
 * POST /admin/link-account
 * Creates linked account + stakeholder + product configuration in one request.
 * Saves linked_account_id on shop if shopId provided.
 */
export const linkAccount = async (req, res) => {
  let linkedAccount = null;
  let stakeholder = null;
  let productConfig = null;

  // Helper: sanitize stakeholder residential address to use single 'street' key
  function sanitizeStakeholderResidential(addr = {}) {
    const street =
      addr.street ??
      [addr.street1, addr.street2].filter(Boolean).join(", ").trim();
    return {
      street: street || "",
      city: addr.city || "",
      state: addr.state || "",
      postal_code: String(addr.postal_code || ""),
      country: addr.country || "IN",
    };
  }

  try {
    const { vendorDetails, stakeholderDetails, shopId } = req.body;
    console.log("linkAccount request body:", req.body);

    // 1) Create linked account (addresses belong inside profile for the account)
    try {
      const accountPayload = {
        email: vendorDetails.email,
        phone: String(vendorDetails.phone),
        type: "route",
        reference_id: vendorDetails.reference_id,
        legal_business_name: vendorDetails.business_name,
        business_type: vendorDetails.business_type || "individual",
        contact_name: vendorDetails.contact_name,
        profile: {
          category: vendorDetails.profile.category,
          subcategory: vendorDetails.profile.subcategory,
          addresses: vendorDetails.profile.addresses,
        },
      };

      console.log("🔄 Creating linked account...");
      linkedAccount = await razorpay.accounts.create(accountPayload);
      console.log("✅ Linked account created successfully:", linkedAccount.id);
    } catch (accountError) {
      console.error("❌ Linked account creation failed:", accountError);
      throw accountError;
    }

    // 2) Create stakeholder via v2 path-style (account_id in path), with correct residential schema
    try {
      const residential = sanitizeStakeholderResidential(
        stakeholderDetails.addresses?.residential || {}
      );

      const stakeholderPayload = {
        name: stakeholderDetails.name,
        email: stakeholderDetails.email,
        percentage_ownership: 100,
        relationship: stakeholderDetails.relationship || {
          director: true,
          executive: true,
        },
        phone: {
          primary: String(stakeholderDetails.phone),
          secondary: stakeholderDetails.secondary_phone
            ? String(stakeholderDetails.secondary_phone)
            : "",
        },
        addresses: { residential }, // single 'street' key only
        kyc: { pan: stakeholderDetails.kyc.pan },
      };

      console.log("🔄 Creating stakeholder...");
      // IMPORTANT: do not shadow the outer 'stakeholder' variable
      stakeholder = await razorpay.stakeholders.create(
        linkedAccount.id,
        stakeholderPayload
      );
      console.log("✅ Stakeholder created successfully:", stakeholder.id);
    } catch (stakeholderError) {
      console.error("❌ Stakeholder creation failed:", stakeholderError);
      throw stakeholderError;
    }

    // 3) Request Route product configuration
    try {
      console.log("🔄 Requesting product configuration...");
      productConfig = await razorpay.products.requestProductConfiguration(
        linkedAccount.id, // First parameter: accountId
        {
          product_name: "route",
          tnc_accepted: true,
        }
      );
      console.log(
        "✅ Product config requested successfully:",
        productConfig.id
      );
      // Store success state
      if (shopId) {
        await RentalShop.findByIdAndUpdate(
          shopId,
          {
            $set: {
              "razorpay.route_config": {
                product_id: productConfig.id,
                status: productConfig.status || "pending",
                error: null, // Clear any previous errors
              },
            },
          },
          { new: true }
        );
      }
    } catch (productError) {
      console.warn("⚠️ Product config request failed:", productError.message);
      productConfig = {
        error: productError.message || String(productError),
        status: "failed",
      };
      // Store error state in DB if shopId exists
      if (shopId) {
        await RentalShop.findByIdAndUpdate(
          shopId,
          {
            $set: {
              "razorpay.route_config": {
                product_id: null, // Clear product_id on error
                status: "failed",
                error:
                  productError.message ||
                  "Failed to request product configuration",
              },
            },
          },
          { new: true }
        ).catch((dbError) => {
          console.error("Failed to update shop with product error:", dbError);
        });
      }
    }

    // 4) Update DB (guarded)
    if (shopId) {
      try {
        console.log("🔄 Updating shop with ID:", shopId);
        const existingShop = await RentalShop.findById(shopId);
        if (!existingShop) {
          console.warn("⚠️ Shop not found with ID:", shopId);
        } else {
          console.log("✅ Shop found, updating...");
          const updateResult = await RentalShop.findByIdAndUpdate(
            shopId,
            {
              $set: {
                "razorpay.linked_account_id": linkedAccount.id,
                "razorpay.account_details": {
                  legal_business_name: linkedAccount.legal_business_name,
                  contact_name: linkedAccount.contact_name,
                  email: linkedAccount.email,
                  phone: linkedAccount.phone,
                  status: linkedAccount.status,
                  created_at: new Date(),
                },
                "razorpay.route_config": {
                  product_id: productConfig.id,
                  status: productConfig.status || "pending",
                },
              },
            },
            { new: true }
          );
          if (updateResult) {
            console.log("✅ Shop updated successfully");
          } else {
            console.warn("⚠️ Shop update returned null");
          }
        }
      } catch (dbError) {
        console.error("❌ Database update failed:", {
          message: dbError.message,
          statusCode: dbError.statusCode,
          name: dbError.name,
          stack: dbError.stack,
        });
        console.log("⚠️ Continuing despite database error...");
      }
    } else {
      console.log("ℹ️ No shopId provided, skipping database update");
    }

    // Success
    console.log("✅ All operations completed successfully");
    res.json({
      success: true,
      linkedAccount,
      stakeholder,
      productConfig,
      database_update: shopId ? "attempted" : "skipped",
    });
  } catch (err) {
    console.error("❌ Overall linkAccount error:", {
      message: err.message,
      statusCode: err.statusCode,
      errorCode: err.error?.code,
      description: err.error?.description,
      field: err.error?.field,
      stack: err.stack,
    });

    if (err.error?.code === "BAD_REQUEST_ERROR") {
      return res.status(400).json({
        success: false,
        error: err.error.description || err.message,
        field: err.error.field || null,
        razorpay_error: err.error,
      });
    }

    if (err.statusCode === 404) {
      return res.status(404).json({
        success: false,
        error: "Resource not found",
        details: err.error || err.message || "Unknown 404 error",
        created_resources: {
          linked_account_id: linkedAccount?.id || null,
          stakeholder_id: stakeholder?.id || null,
          product_config_status: productConfig?.status || null,
        },
      });
    }

    res.status(500).json({
      success: false,
      error: err.message || "Unknown error occurred",
      statusCode: err.statusCode,
      created_resources: {
        linked_account_id: linkedAccount?.id || null,
        stakeholder_id: stakeholder?.id || null,
        product_config_status: productConfig?.status || null,
      },
    });
  }
};

/**
 * POST /admin/update-bank-details/:account_id
 * Updates Route product configuration with bank details to activate transfers
 */
export const updateBankDetails = async (req, res) => {
  try {
    const { account_id } = req.params;
    const { ifsc, account_number, beneficiary_name, product_id, shopId } =
      req.body;

    if (!ifsc || !account_number || !beneficiary_name || !product_id) {
      return res.status(400).json({
        success: false,
        error:
          "IFSC code, account number, beneficiary name, and product_id are required",
      });
    }

    // Update Razorpay Route product configuration
    const updatedProduct = await axios.patch(
      `https://api.razorpay.com/v2/accounts/${account_id}/products/${product_id}`,
      {
        settlements: {
          account_number: String(account_number), // ✅ Convert to string
          beneficiary_name: beneficiary_name,
          ifsc_code: ifsc,
        },
        tnc_accepted: true,
      },
      {
        auth: {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET,
        },
        headers: { "Content-Type": "application/json" },
      }
    );

    // Update both bank and razorpay sections in shop document
    if (shopId) {
      await RentalShop.findByIdAndUpdate(shopId, {
        $set: {
          "bank.account_holder": beneficiary_name,
          "bank.account_number": account_number,
          "bank.ifsc": ifsc,
          "bank.verification_status": "verified",
          "bank.verified_at": new Date(),
          "razorpay.route_config.bank_details_verified": true,
          "razorpay.route_config.bank_verified_at": new Date(),
          "razorpay.route_config.status": updatedProduct.data.activation_status,
          "razorpay.route_config.bank_verification_error": null, // Clear any previous errors
        },
      });
    }

    res.json({
      success: true,
      message: "Bank details updated and verified successfully",
      product_config: {
        id: updatedProduct.data.id,
        activation_status: updatedProduct.data.activation_status,
        bank_details_verified: true,
      },
    });
  } catch (err) {
    console.error("update-bank-details error:", err);

    // Update error status in DB if shopId provided
    if (req.body.shopId) {
      await RentalShop.findByIdAndUpdate(req.body.shopId, {
        $set: {
          "bank.verification_status": "rejected",
          "bank.verification_error":
            err.response?.data?.error?.description || err.message,
          "bank.last_verification_attempt": new Date(),
          "razorpay.route_config.bank_verification_error":
            err.response?.data?.error?.description || err.message,
        },
      }).catch(console.error);
    }

    if (err.response?.status === 400) {
      return res.status(400).json({
        success: false,
        error:
          err.response.data.error?.description ||
          "Bank details validation failed",
      });
    }

    res.status(500).json({
      success: false,
      error: err.message || "Failed to update bank details",
    });
  }
};

/**
 * PATCH /admin/linked-accounts/:account_id
 * Updates an existing linked account's details in Razorpay and local DB
 * Note: business_type and email cannot be updated per Razorpay restrictions
 */
export const updateLinkedAccount = async (req, res) => {
  try {
    const { account_id } = req.params;
    const updateData = req.body;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: "account_id is required",
      });
    }

    // Validate no restricted fields
    const restrictedFields = ["business_type", "email"];
    if (restrictedFields.some((field) => updateData.hasOwnProperty(field))) {
      return res.status(400).json({
        success: false,
        error: `Cannot update restricted fields: ${restrictedFields.join(
          ", "
        )}`,
      });
    }

    // Build Razorpay update payload from allowed fields
    const updatePayload = {
      ...(updateData.phone && { phone: updateData.phone }),
      ...(updateData.legal_business_name && {
        legal_business_name: updateData.legal_business_name,
      }),
      ...(updateData.customer_facing_business_name && {
        customer_facing_business_name: updateData.customer_facing_business_name,
      }),
      ...(updateData.reference_id && { reference_id: updateData.reference_id }),
      ...(updateData.contact_name && { contact_name: updateData.contact_name }),
      ...(updateData.profile && { profile: updateData.profile }),
      ...(updateData.legal_info && { legal_info: updateData.legal_info }),
      ...(updateData.contact_info && { contact_info: updateData.contact_info }),
      ...(updateData.apps && { apps: updateData.apps }),
      ...(updateData.notes && { notes: updateData.notes }),
    };

    // Update in Razorpay
    const updatedAccount = await razorpay.accounts.edit(
      account_id,
      updatePayload
    );

    // Update shop record if shopId provided
    if (updateData.shopId) {
      await RentalShop.findByIdAndUpdate(updateData.shopId, {
        $set: {
          "razorpay.linked_account_id": linkedAccount.id,
          "razorpay.account_details": {
            legal_business_name: updatedAccount.legal_business_name,
            customer_facing_business_name:
              updatedAccount.customer_facing_business_name,
            contact_name: updatedAccount.contact_name,
            phone: updatedAccount.phone,
            status: updatedAccount.status,
            updated_at: new Date(),
          },
        },
      });
    }

    res.json({
      success: true,
      message: "Linked account updated successfully",
      account: updatedAccount,
    });
  } catch (err) {
    console.error("update-linked-account error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to update linked account",
    });
  }
};

/**
 * GET /admin/linked-accounts/:account_id
 * Fetches details of a specific linked account from Razorpay and optional shop details
 * Query params:
 * - include_shop: boolean (optional) - Include associated shop details
 */
export const fetchLinkedAccount = async (req, res) => {
  try {
    const { account_id } = req.params;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: "account_id is required",
      });
    }

    // Fetch account details from Razorpay
    const account = await razorpay.accounts.fetch(account_id);

    if (!account) {
      return res.status(404).json({
        success: false,
        error: "Linked account not found",
      });
    }

    // Optionally fetch associated shop details
    let shopDetails = null;
    if (req.query.include_shop === "true") {
      shopDetails = await RentalShop.findOne({
        "razorpay.linked_account_id": account_id,
      }).select("name contact kyc bank razorpay.status razorpay.route_config");
    }

    res.json({
      success: true,
      account: {
        id: account.id,
        type: account.type,
        status: account.status,
        reference_id: account.reference_id,
        legal_business_name: account.legal_business_name,
        customer_facing_business_name: account.customer_facing_business_name,
        business_type: account.business_type,
        contact_name: account.contact_name,
        email: account.email,
        phone: account.phone,
        profile: account.profile,
        legal_info: account.legal_info,
        contact_info: account.contact_info,
        apps: account.apps,
        notes: account.notes,
        created_at: account.created_at,
        updated_at: account.updated_at,
      },
      shop_details: shopDetails,
    });
  } catch (err) {
    console.error("fetch-linked-account error:", err);

    // Handle Razorpay-specific error codes
    if (err.statusCode === 404 || err.error?.code === "BAD_REQUEST_ERROR") {
      return res.status(404).json({
        success: false,
        error: "Linked account not found or invalid account_id",
      });
    }

    res.status(500).json({
      success: false,
      error: err.message || "Failed to fetch linked account",
    });
  }
};

/**
 * GET /admin/linked-accounts/:account_id/status
 * Checks if linked account is ready for transfers (Route product activated)
 */
export const checkAccountStatus = async (req, res) => {
  try {
    const { account_id } = req.params;

    if (!account_id) {
      return res.status(400).json({
        success: false,
        error: "account_id is required",
      });
    }

    // 1. Fetch account details from Razorpay
    const account = await razorpay.accounts.fetch(account_id);

    // 2. Get shop details first to find stored product_id
    const shop = await RentalShop.findOne({
      "razorpay.linked_account_id": account_id,
    });

    // 3. Check Route product configuration status using stored product_id
    let productStatus = "not_requested";

    if (shop?.razorpay?.route_config?.product_id) {
      try {
        // Use direct REST API with specific product_id
        const auth = {
          username: process.env.RAZORPAY_KEY_ID,
          password: process.env.RAZORPAY_KEY_SECRET,
        };

        const { data: product } = await axios.get(
          `https://api.razorpay.com/v2/accounts/${account_id}/products/${shop.razorpay.route_config.product_id}`,
          { auth }
        );

        productStatus = product.activation_status || "unknown";
      } catch (productErr) {
        console.warn("Failed to check product status:", productErr.message);
        // Fall back to stored status if API fails
        productStatus =
          shop.razorpay?.route_config?.status || "error_checking_products";
      }
    } else {
      // No product_id stored, check if we have any status in database
      productStatus = shop?.razorpay?.route_config?.status || "not_requested";
    }

    // 4. Determine overall transfer readiness
    const isReadyForTransfers =
      account.status === "activated" && productStatus === "activated";

    // 5. Update status in RentalShop
    if (shop) {
      await RentalShop.findByIdAndUpdate(shop._id, {
        $set: {
          "razorpay.status": account.status,
          "razorpay.route_config.status": productStatus,
          "razorpay.last_status_check": new Date(),
        },
      });
    }

    res.json({
      success: true,
      account_id: account.id,
      account_status: account.status,
      route_product_status: productStatus,
      ready_for_transfers: isReadyForTransfers,
      business_name: account.legal_business_name,
      email: account.email,
      phone: account.phone,
      shop_details: shop
        ? {
            id: shop._id,
            name: shop.name,
            has_product_id: !!shop.razorpay?.route_config?.product_id,
          }
        : null,
    });
  } catch (err) {
    console.error("check-account-status error:", err);

    if (err.statusCode === 404 || err.error?.code === "BAD_REQUEST_ERROR") {
      return res.status(404).json({
        success: false,
        error: "Linked account not found or invalid account_id",
      });
    }

    res.status(500).json({
      success: false,
      error: err.message || "Failed to check account status",
    });
  }
};

/**
 * POST /create-order
 * Create an order with transfer(s) (payment routing).
 * body: { amount, currency = 'INR', vendorAccountId, vendorShare }
 */
export const createOrder = async (req, res) => {
  try {
    const {
      amount,
      currency = "INR",
      vendorAccountId,
      depositAmount = 0,
      platformFee = 0,
    } = req.body;

    if (!amount) {
      return res.status(400).json({ success: false, error: "amount required" });
    }

    // Convert to paise
    const totalAmountPaise = Math.round(amount * 100);
    const depositPaise = Math.round(depositAmount * 100);
    const platformFeePaise = Math.round(platformFee * 100);
    const rentalOwnerSharePaise =
      totalAmountPaise - depositPaise - platformFeePaise;

    // Build transfers array
    const transfers = [];

    // 3) Rental owner share
    if (vendorAccountId && rentalOwnerSharePaise > 0) {
      transfers.push({
        account: vendorAccountId,
        amount: rentalOwnerSharePaise,
        currency,
        on_hold: false,
        notes: { type: "instrument_rental" },
      });
    }

    const orderOptions = {
      amount: totalAmountPaise,
      currency,
      receipt: `order_${Date.now()}`,
      partial_payment: false,
      transfers,
    };

    const order = await razorpay.orders.create(orderOptions);

    res.json({
      success: true,
      order: order,
      order_id: order.id,
      total_amount: totalAmountPaise,
      deposit: depositPaise,
      platform_fee: platformFeePaise,
      rental_owner_share: rentalOwnerSharePaise,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("create-order error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * POST /verify-payment
 * Verifies signatures and returns payment + transfer info.
 * body: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } =
      req.body;
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "missing params" });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const valid = svcVerify(
      payload,
      razorpay_signature,
      process.env.RAZORPAY_KEY_SECRET
    );
    if (!valid)
      return res
        .status(400)
        .json({ success: false, error: "Invalid signature" });

    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    if (payment.status !== "captured") {
      return res
        .status(400)
        .json({
          success: false,
          error: "Payment not captured",
          payment_status: payment.status,
        });
    }

    const transfers = await razorpay.transfers.all({
      payment_id: razorpay_payment_id,
    });
    res.json({
      success: true,
      payment_id: razorpay_payment_id,
      status: payment.status,
      transfers: transfers.items,
    });
  } catch (err) {
    console.error("verify-payment error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /transfers/:payment_id
 * Fetch transfers for a payment
 */
export const getTransfers = async (req, res) => {
  try {
    const transfers = await razorpay.transfers.all({
      payment_id: req.params.payment_id,
    });
    res.json({ success: true, transfers: transfers.items });
  } catch (err) {
    console.error("transfers error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

export const refundService = {
  /**
   * Process a refund (full or partial)
   * @param {string} paymentId - Razorpay payment ID
   * @param {number} amount - Amount in rupees (will be converted to paise)
   * @param {object} options - Additional options 
   * @returns {Promise<Object>} Refund details
   */

  async processRefund(paymentId, amount = null, options = {}) {
    const refundOptions = {
      speed: options.speed || 'normal',
      notes: options.notes || {},
      receipt: options.receipt
    };

    // If amount specified, convert to paise and add to options
    if (amount) {
      refundOptions.amount = Math.round(amount * 100); // Convert to paise
    }

    // Create refund
    return razorpay.payments.refund(paymentId, refundOptions);
  },

  /**
   * Get refund details by ID
   */
  async getRefundById(refundId) {
    return razorpay.refunds.fetch(refundId);
  },

  /**
   * List all refunds for a payment
   */
  async getRefundsForPayment(paymentId) {
    return razorpay.payments.fetchRefunds(paymentId);
  }
};

/**
 * POST /refund/:payment_id
 * Process a refund (full or partial)
 * body: { 
 *   amount?: number,       // Optional: amount in rupees for partial refund
 *   speed?: string,       // Optional: 'normal' or 'optimum'
 *   notes?: object,       // Optional: key-value pairs
 *   receipt?: string      // Optional: your reference number
 * }
 */
export const processRefund = async (req, res) => {
  try{
    const { payment_id } = req.params;
    const { amount, speed, notes, receipt } = req.body;

    // Validate payment exists first
    const payment = await razorpay.payments.fetch(payment_id);
    if (!payment) {
      return res.status(404).json({ 
        success: false, 
        error: "Payment not found" 
      });
    }

    // If amount specified, validate it's not more than captured amount
    if (amount) {
      const amountPaise = Math.round(amount * 100);
      if (amountPaise > payment.amount) {
        return res.status(400).json({
          success: false,
          error: "Refund amount cannot exceed payment amount",
          max_refundable: payment.amount / 100 // Convert back to rupees
        });
      }
    }

    const refund = await refundService.processRefund(payment_id, amount, {
      speed,
      notes: {
        ...notes,
        initiated_by: req.user?.id || 'system',
        initiated_at: new Date().toISOString()
      },
      receipt
    });

    // If this is linked to a booking, update its status
    if (payment.notes?.booking_id) {
      const booking = await RentalBooking.findById(payment.notes.booking_id);
      if (booking) {
        const isFullRefund = !amount || (amount * 100) === payment.amount;
        booking.deposit.status = isFullRefund ? 'refunded' : 'partially_refunded';
        booking.deposit.refund_id = refund.id;
        await booking.save();
      }
    }

    res.json({
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100, // Convert to rupees
        status: refund.status,
        speed_processed: refund.speed_processed,
        created_at: new Date(refund.created_at * 1000)
      }
    });
  } catch (err) {
    console.error("Process refund error:", err);

    // Handle specific Razorpay error codes
    if (err.error?.code === "BAD_REQUEST_ERROR") {
      return res.status(400).json({
        success: false,
        error: err.error.description || err.message
      });
    }

    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /refunds/:refund_id
 * Get refund details by ID
 */
export const getRefund = async (req, res) => {
  try {
    const refund = await refundService.getRefundById(req.params.refund_id);
    res.json({ success: true, refund });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * GET /payments/:payment_id/refunds
 * List all refunds for a payment
 */
export const getPaymentRefunds = async (req, res) => {
  try {
    const refunds = await refundService.getRefundsForPayment(req.params.payment_id);
    res.json({ success: true, refunds: refunds.items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};


