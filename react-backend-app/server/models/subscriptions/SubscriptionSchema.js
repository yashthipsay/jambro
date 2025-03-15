const mongoose = require("mongoose");

// Subscription Schema - for managing active subscriptions
const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["INDIVIDUAL", "GROUP"],
      required: true,
    },
    primaryUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SKU",
      required: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "CANCELLED", "EXPIRED", "PENDING"],
      default: "PENDING",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    autoRenew: {
      type: Boolean,
      default: true,
    },
    remainingHours: {
      type: Number,
      required: true,
    },
    accessType: {
      type: String,
      enum: ["JAM_ROOM", "STUDIO", "BOTH"],
      required: true,
    },
    razorpaySubscriptionId: {
      type: String,
      required: true,
    },
    pendingCancellation: {
      type: Boolean,
      default: false,
    },
    cancelAtEnd: {
      type: Boolean,
      default: false,
    },
    cancelledAt: {
      type: Date,
    },
    planId: {
      type: String
    },
    hasScheduledChanges: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
  }
);

// SKU Schema - for different subscription plans/tiers
const skuSchema = new mongoose.Schema(
  {
    skuId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // in months
      required: true,
    },
    hoursPerMonth: {
      type: Number,
      required: true,
    },
    accessType: {
      type: String,
      enum: ["JAM_ROOM", "STUDIO", "BOTH"],
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// SKU Payment Schema - for tracking subscription payments
const skuPaymentSchema = new mongoose.Schema(
  {
    skuPaymentId: {
      type: String,
      required: true,
      unique: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["ONE_TIME", "RECURRING"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
    },
    razorpayPaymentId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
subscriptionSchema.index({ subscriptionId: 1, status: 1 });
subscriptionSchema.index({ primaryUserId: 1 });
subscriptionSchema.index({ memberEmails: 1 });

skuSchema.index({ skuId: 1 });
skuSchema.index({ accessType: 1, isActive: 1 });

skuPaymentSchema.index({ subscriptionId: 1, status: 1 });
skuPaymentSchema.index({ userId: 1 });
skuPaymentSchema.index({ razorpayPaymentId: 1 });

module.exports = {
  Subscription: mongoose.model("Subscription", subscriptionSchema),
  SKU: mongoose.model("SKU", skuSchema),
  SKUPayment: mongoose.model("SKUPayment", skuPaymentSchema),
};
