const mongoose = require("mongoose");

const groupSchema = new mongoose.Schema(
  {
    groupId: {
      type: String,
      required: true,
      unique: true,
    },
    groupName: {
      type: String,
      required: true,
      trim: true,
    },
    groupDescription: {
      type: String,
      trim: true,
      maxLength: 500,
    },
    groupMembers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        email: {
          type: String,
          required: true,
        },
        role: {
          type: String,
          enum: ["ADMIN", "MEMBER"],
          default: "MEMBER",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ["PENDING", "ACTIVE", "INACTIVE"],
          default: "PENDING",
        },
      },
    ],
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    maxMembers: {
      type: Number,
      default: 6, // 1 admin + 5 members
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "DELETED"],
      default: "ACTIVE",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    deactivatedAt: {
      type: Date,
    },
    deletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Add a pre-save middleware to check if group can be deleted
groupSchema.pre("save", async function (next) {
  if (this.isModified("status") && this.status === "DELETED") {
    const subscription = await mongoose.model("Subscription").findOne({
      _id: this.subscriptionId,
      status: "ACTIVE",
    });

    if (subscription) {
      throw new Error("Cannot delete group with active subscription");
    }
  }
  next();
});

// Add index for better query performance
groupSchema.index({ groupId: 1, status: 1 });
groupSchema.index({ "groupMembers.email": 1 });
groupSchema.index({ groupAdmin: 1 });

// Validate maximum members
groupSchema.pre("save", function (next) {
  if (this.groupMembers.length > this.maxMembers) {
    next(new Error(`Group cannot have more than ${this.maxMembers} members`));
  }
  next();
});

module.exports = mongoose.model("Group", groupSchema);
