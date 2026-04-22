import mongoose from "mongoose";

export const COUPON_DISCOUNT_TYPES = ["percentage", "fixed"];

const couponUsageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      maxlength: 30
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },
    discountType: {
      type: String,
      enum: COUPON_DISCOUNT_TYPES,
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minOrderAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    usageLimit: {
      type: Number,
      min: 1,
    },
    userUsageLimit: {
      type: Number,
      min: 1,
      default: 1,
    },
    startsAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageCount: {
      type: Number,
      min: 0,
      default: 0,
    },
    usedBy: {
      type: [couponUsageSchema],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

couponSchema.pre("validate", function () {
  this.code = String(this.code || "").trim().toUpperCase();

  if (this.discountType === "percentage" && this.discountValue > 100) {
    this.invalidate("discountValue", "Percentage discount cannot exceed 100");
  }

  if (this.expiresAt && this.startsAt && this.expiresAt <= this.startsAt) {
    this.invalidate("expiresAt", "expiresAt must be after startsAt");
  }

  if (this.usageLimit && this.usageCount > this.usageLimit) {
    this.invalidate("usageCount", "usageCount cannot exceed usageLimit");
  }
});

couponSchema.index({ isActive: 1, startsAt: 1, expiresAt: 1 });
couponSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model("Coupon", couponSchema);
