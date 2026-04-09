import mongoose from "mongoose";

export const ORDER_STATUSES = [
  "Placed",
  "Confirmed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

export const PAYMENT_STATUSES = ["Pending", "Paid", "Failed", "Refunded"];

const roundCurrency = (value) => Number((Number(value) || 0).toFixed(2));

const trackingEventSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ORDER_STATUSES,
      required: true,
    },
    note: {
      type: String,
      trim: true,
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    imageUrl: {
      type: String,
      trim: true,
      default: "",
    },
    variant: {
      size: { type: String, trim: true, default: "" },
      color: { type: String, trim: true, default: "" },
      sku: { type: String, trim: true, default: "" },
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPrice: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

const vendorOrderSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: "Vendor order must contain at least one item",
      },
      required: true,
    },
    subtotal: {
      type: Number,
      min: 0,
      default: 0,
    },
    discountAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    shippingFee: {
      type: Number,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Placed",
    },
    estimatedDelivery: {
      type: Date,
    },
    trackingHistory: {
      type: [trackingEventSchema],
      default: [],
    },
  },
  { _id: true }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, default: "" },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
    country: { type: String, required: true, trim: true, maxlength: 100 },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      trim: true,
      default: "Card",
    },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "Pending",
    },
    transactionId: {
      type: String,
      trim: true,
      default: "",
    },
    paidAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { _id: false }
);

const deriveOverallStatus = (vendorOrders) => {
  const statuses = vendorOrders.map((vendorOrder) => vendorOrder.status);

  if (statuses.length === 0) return "Placed";
  if (statuses.every((status) => status === "Cancelled")) return "Cancelled";
  if (statuses.every((status) => status === "Delivered")) return "Delivered";
  if (statuses.some((status) => status === "Shipped" || status === "Delivered")) {
    return "Shipped";
  }
  if (statuses.some((status) => status === "Confirmed")) return "Confirmed";
  return "Placed";
};

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendorOrders: {
      type: [vendorOrderSchema],
      required: true,
      validate: {
        validator: (orders) => Array.isArray(orders) && orders.length > 0,
        message: "Order must contain at least one vendor order",
      },
    },
    overallStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Placed",
    },
    couponCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: "",
    },
    payment: {
      type: paymentSchema,
      default: () => ({}),
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    priceSummary: {
      subtotal: { type: Number, min: 0, default: 0 },
      discountAmount: { type: Number, min: 0, default: 0 },
      shippingFee: { type: Number, min: 0, default: 0 },
      totalAmount: { type: Number, min: 0, default: 0 },
    },
  },
  { timestamps: true }
);

orderSchema.pre("validate", function (next) {
  if (!Array.isArray(this.vendorOrders) || this.vendorOrders.length === 0) {
    return next();
  }

  let subtotal = 0;
  let totalDiscount = 0;
  let totalShipping = 0;

  this.vendorOrders.forEach((vendorOrder) => {
    let vendorSubtotal = 0;

    vendorOrder.items.forEach((item) => {
      item.totalPrice = roundCurrency(item.quantity * item.unitPrice);
      vendorSubtotal += item.totalPrice;
    });

    vendorOrder.subtotal = roundCurrency(vendorSubtotal);
    vendorOrder.discountAmount = roundCurrency(vendorOrder.discountAmount);
    vendorOrder.shippingFee = roundCurrency(vendorOrder.shippingFee);
    vendorOrder.totalAmount = roundCurrency(
      vendorOrder.subtotal - vendorOrder.discountAmount + vendorOrder.shippingFee
    );

    if (!Array.isArray(vendorOrder.trackingHistory)) {
      vendorOrder.trackingHistory = [];
    }

    if (vendorOrder.trackingHistory.length === 0) {
      vendorOrder.trackingHistory.push({
        status: vendorOrder.status || "Placed",
        note: "Order placed",
      });
    }

    subtotal += vendorOrder.subtotal;
    totalDiscount += vendorOrder.discountAmount;
    totalShipping += vendorOrder.shippingFee;
  });

  this.priceSummary.subtotal = roundCurrency(subtotal);
  this.priceSummary.discountAmount = roundCurrency(totalDiscount);
  this.priceSummary.shippingFee = roundCurrency(totalShipping);
  this.priceSummary.totalAmount = roundCurrency(
    subtotal - totalDiscount + totalShipping
  );

  if (!this.payment?.status) {
    this.payment.status = "Pending";
  }

  this.overallStatus = deriveOverallStatus(this.vendorOrders);
  next();
});

orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ buyer: 1, createdAt: -1 });
orderSchema.index({ "vendorOrders.vendor": 1, createdAt: -1 });

export default mongoose.model("Order", orderSchema);
