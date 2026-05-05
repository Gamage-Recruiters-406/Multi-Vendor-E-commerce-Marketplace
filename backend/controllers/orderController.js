import mongoose from "mongoose";
import Order, { ORDER_STATUSES, PAYMENT_STATUSES } from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import Store from "../models/Store.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Payment from "../models/paymentModel.js";
import {
  evaluateCoupon,
  normalizeCouponCode,
  roundCurrency,
} from "../utils/couponEngine.js";
import notificationService from '../services/notificationService.js';

const ORDER_STATUS_TRANSITIONS = {
  Placed: ["Confirmed", "Cancelled"],
  Confirmed: ["Shipped", "Cancelled"],
  Shipped: ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const toIdString = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value?._id) return String(value._id);
  return String(value);
};

const enrichCartItemsWithStoreId = async (cartItems) => {
  const enrichedItems = [];
  
  for (const item of cartItems) {
    if (!item.store_id) {
      if (item.product_id && item.product_id.store) {
        item.store_id = item.product_id.store;
        console.log(` Enriched item ${item.product_id._id} with store_id: ${item.product_id.store}`);
      } else {
        const Product = (await import('../models/Product.js')).default;
        const product = await Product.findById(item.product_id).select('store');
        
        if (product && product.store) {
          item.store_id = product.store;
          console.log(` Enriched item ${item.product_id} with store_id: ${product.store}`);
        } else {
          console.warn(` Product ${item.product_id} missing store field`);
        }
      }
    }
    enrichedItems.push(item);
  }
  
  return enrichedItems;
};

const canAccessOrder = (order, user) => {
  if (!order || !user) return false;

  if (user.role === "admin") return true;

  const userId = String(user._id);
  if (user.role === "Buyer" && String(order.buyer) === userId) {
    return true;
  }

  if (
    user.role === "Vendor" &&
    order.vendorOrders.some((segment) => toIdString(segment.vendor) === userId)
  ) {
    return true;
  }

  return false;
};

const canTransitionStatus = (currentStatus, nextStatus) => {
  return ORDER_STATUS_TRANSITIONS[currentStatus]?.includes(nextStatus) || false;
};

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const extractStoreVendorId = (store) =>
  toIdString(store?.vendor || store?.createdBy || store?.owner_id);

const uniqStrings = (values) => {
  const set = new Set();
  values.forEach((value) => {
    const str = toIdString(value);
    if (str) set.add(str);
  });
  return [...set];
};

const toObjectIds = (ids) => {
  return ids
    .map((id) => {
      if (!id || !mongoose.Types.ObjectId.isValid(id)) return null;
      return new mongoose.Types.ObjectId(id);
    })
    .filter(Boolean);
};

// Vendor access can be based on vendor user id (preferred) OR store id (legacy/older data).
const getVendorAccessIds = async (vendorUserId) => {
  const vendorId = toIdString(vendorUserId);
  const stores = await Store.find({
    $or: [{ vendor: vendorUserId }, { createdBy: vendorUserId }, { owner_id: vendorUserId }],
  })
    .select("_id vendor createdBy owner_id")
    .lean();
  const storeIds = stores.map((store) => String(store._id));
  const allIds = uniqStrings([vendorId, ...storeIds]);
  return {
    vendorId,
    storeIds,
    allIds,
    objectIds: toObjectIds(allIds),
  };
};

const buildVendorOrdersMatchQuery = (ids) => ({
  $expr: {
    $gt: [
      {
        $size: {
          $filter: {
            input: "$vendorOrders",
            as: "segment",
            cond: { $in: [{ $toString: "$$segment.vendor" }, ids] },
          },
        },
      },
      0,
    ],
  },
});

const getVendorProductIdSet = async (storeIds) => {
  const storeObjectIds = toObjectIds(storeIds);
  if (!storeObjectIds.length) return new Set();

  const products = await Product.find({ store: { $in: storeObjectIds } })
    .select("_id")
    .lean();

  return new Set(products.map((product) => String(product._id)));
};

const orderHasVendorProducts = (order, productIdSet) => {
  if (!productIdSet.size) return false;
  return order.vendorOrders.some((segment) =>
    Array.isArray(segment.items) &&
    segment.items.some((item) => productIdSet.has(String(item.productId)))
  );
};

const findVendorSegment = (order, vendorMatchIds, productIdSet) => {
  const directMatch = order.vendorOrders.find((segment) =>
    vendorMatchIds.has(toIdString(segment.vendor))
  );

  if (directMatch) return directMatch;
  if (!productIdSet.size) return null;

  return order.vendorOrders.find(
    (segment) =>
      Array.isArray(segment.items) &&
      segment.items.some((item) => productIdSet.has(String(item.productId)))
  );
};

// Accept vendorOrders[].vendor as either Vendor userId OR StoreId.
// If vendor is missing/wrong, resolve using item -> product -> store -> vendor.
// Returns vendorOrders with vendor resolved to Vendor userId (preferred canonical storage).
const resolveVendorOrdersVendorIds = async (vendorOrders) => {
  const segments = Array.isArray(vendorOrders) ? vendorOrders : [];
  const rawIds = uniqStrings(segments.map((segment) => segment?.vendor));
  const objectIds = toObjectIds(rawIds);

  const vendorUsers = await User.find({ _id: { $in: objectIds }, role: "Vendor" })
    .select("_id")
    .lean();
  const vendorUserIdSet = new Set(vendorUsers.map((user) => String(user._id)));

  const unresolvedIds = rawIds.filter((id) => !vendorUserIdSet.has(id));
  const storeObjectIds = toObjectIds(unresolvedIds);

  const productIds = uniqStrings(
    segments.flatMap((segment) => (segment?.items || []).map((item) => item?.productId))
  );
  const productObjectIds = toObjectIds(productIds);

  const products = productObjectIds.length
    ? await Product.find({ _id: { $in: productObjectIds } }).select("_id store").lean()
    : [];

  const productToStoreMap = new Map(
    products.map((product) => [String(product._id), toIdString(product.store)])
  );
  const storeIdsFromProducts = uniqStrings(products.map((product) => product?.store));
  const storeIdsToLoad = uniqStrings([
    ...storeObjectIds.map((id) => String(id)),
    ...storeIdsFromProducts,
  ]);

  const stores = storeIdsToLoad.length
    ? await Store.find({ _id: { $in: toObjectIds(storeIdsToLoad) } })
        .select("_id vendor createdBy owner_id")
        .lean()
    : [];

  const storeToVendorMap = new Map(
    stores
      .map((store) => [String(store._id), extractStoreVendorId(store)])
      .filter(([, vendorId]) => vendorId)
  );

  const resolvedVendorOrders = segments.map((segment) => {
    const vendorKey = toIdString(segment?.vendor);
    let resolvedVendorId = vendorUserIdSet.has(vendorKey)
      ? vendorKey
      : storeToVendorMap.get(vendorKey);

    if (!resolvedVendorId) {
      const itemProductIds = uniqStrings(
        (segment?.items || []).map((item) => item?.productId)
      );
      const itemStoreIds = uniqStrings(
        itemProductIds.map((productId) => productToStoreMap.get(toIdString(productId)))
      ).filter(Boolean);

      if (itemStoreIds.length === 1) {
        resolvedVendorId = storeToVendorMap.get(itemStoreIds[0]);
      }
    }

    return {
      ...segment,
      vendor: resolvedVendorId || segment?.vendor,
    };
  });

  const resolvedVendorIds = resolvedVendorOrders.map((segment) => toIdString(segment?.vendor));
  const missing = resolvedVendorIds.some((id) => !id || !mongoose.Types.ObjectId.isValid(id));

  if (missing) {
    return {
      resolvedVendorOrders,
      isValid: false,
      message: "Unable to resolve vendor for one or more order segments",
    };
  }

  // Ensure resolved vendor ids are actually Vendor users.
  const uniqueResolved = uniqStrings(resolvedVendorIds);
  const resolvedCount = await User.countDocuments({
    _id: { $in: toObjectIds(uniqueResolved) },
    role: "Vendor",
  });

  if (resolvedCount !== uniqueResolved.length) {
    return {
      resolvedVendorOrders,
      isValid: false,
      message: "One or more vendor ids are invalid or not vendor accounts",
    };
  }

  return {
    resolvedVendorOrders,
    isValid: true,
    message: null,
  };
};

const generateOrderNumber = () => {
  const now = new Date();
  const pad = (num) => String(num).padStart(2, "0");
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(
    now.getDate()
  )}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const random = Math.floor(1000 + Math.random() * 9000);

  return `ORD-${stamp}-${random}`;
};

const createUniqueOrderNumber = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const candidate = generateOrderNumber();
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) return candidate;
  }

  throw new Error("Unable to generate a unique order number");
};

const calculateItemSubtotal = (item) => {
  const quantity = Number(item?.quantity) || 0;
  const unitPrice = Number(item?.unitPrice) || 0;
  return roundCurrency(quantity * unitPrice);
};

const calculateSegmentSubtotal = (segment) => {
  if (!Array.isArray(segment?.items)) return 0;
  return roundCurrency(segment.items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0));
};

const calculateSegmentNetAmount = (segment) => {
  const subtotal = calculateSegmentSubtotal(segment);
  const existingDiscount = roundCurrency(Number(segment?.discountAmount) || 0);
  return roundCurrency(Math.max(0, subtotal - existingDiscount));
};

const calculateCouponEligibleSubtotal = (vendorOrders) => {
  if (!Array.isArray(vendorOrders)) return 0;
  return roundCurrency(
    vendorOrders.reduce((sum, segment) => sum + calculateSegmentNetAmount(segment), 0)
  );
};

const applyCouponDiscountToVendorOrders = (vendorOrders, couponDiscountAmount) => {
  const discount = roundCurrency(couponDiscountAmount);
  if (!Array.isArray(vendorOrders) || discount <= 0) return vendorOrders;

  const segments = vendorOrders.map((segment) => ({
    ...segment,
    discountAmount: roundCurrency(Number(segment.discountAmount) || 0),
  }));

  const capacities = segments.map((segment) => {
    const subtotal = calculateSegmentSubtotal(segment);
    const existingDiscount = roundCurrency(Number(segment.discountAmount) || 0);
    const available = roundCurrency(Math.max(0, subtotal - existingDiscount));

    return { subtotal, existingDiscount, available };
  });

  const eligibleIndexes = capacities
    .map((capacity, index) => ({ index, available: capacity.available }))
    .filter((entry) => entry.available > 0)
    .map((entry) => entry.index);

  if (eligibleIndexes.length === 0) {
    return segments;
  }

  const totalAvailable = roundCurrency(
    eligibleIndexes.reduce((sum, index) => sum + capacities[index].available, 0)
  );

  const targetDiscount = roundCurrency(Math.min(discount, totalAvailable));
  let distributed = 0;

  eligibleIndexes.forEach((index, position) => {
    const capacity = capacities[index];
    let allocation;

    if (position === eligibleIndexes.length - 1) {
      allocation = roundCurrency(targetDiscount - distributed);
    } else {
      allocation = roundCurrency((targetDiscount * capacity.available) / totalAvailable);
    }

    allocation = roundCurrency(Math.min(allocation, capacity.available));
    distributed = roundCurrency(distributed + allocation);
    segments[index].discountAmount = roundCurrency(capacity.existingDiscount + allocation);
  });

  let remaining = roundCurrency(targetDiscount - distributed);
  if (remaining > 0) {
    for (const index of eligibleIndexes) {
      if (remaining <= 0) break;

      const capacity = capacities[index];
      const alreadyAdded = roundCurrency(
        Number(segments[index].discountAmount) - capacity.existingDiscount
      );
      const headroom = roundCurrency(Math.max(0, capacity.available - alreadyAdded));

      if (headroom <= 0) continue;

      const extra = roundCurrency(Math.min(headroom, remaining));
      segments[index].discountAmount = roundCurrency(
        Number(segments[index].discountAmount) + extra
      );
      remaining = roundCurrency(remaining - extra);
    }
  }

  return segments;
};

const validateOrderPayload = async (payload) => {
  const { shippingAddress, vendorOrders } = payload;

  if (!shippingAddress) {
    return "Shipping address is required";
  }

  const requiredAddressFields = ["fullName", "phone", "line1", "city", "country"];
  for (const field of requiredAddressFields) {
    if (!shippingAddress[field] || String(shippingAddress[field]).trim() === "") {
      return `Shipping address field '${field}' is required`;
    }
  }

  if (!Array.isArray(vendorOrders) || vendorOrders.length === 0) {
    return "At least one vendor order is required";
  }

  for (const [segmentIndex, segment] of vendorOrders.entries()) {
    if (segment.vendor && !mongoose.Types.ObjectId.isValid(segment.vendor)) {
      return `Vendor id is invalid at vendorOrders[${segmentIndex}]`;
    }

    if (!Array.isArray(segment.items) || segment.items.length === 0) {
      return `At least one item is required in vendorOrders[${segmentIndex}]`;
    }

    for (const [itemIndex, item] of segment.items.entries()) {
      if (!item.productId || String(item.productId).trim() === "") {
        return `productId is required at vendorOrders[${segmentIndex}].items[${itemIndex}]`;
      }

      if (!item.productName || String(item.productName).trim() === "") {
        return `productName is required at vendorOrders[${segmentIndex}].items[${itemIndex}]`;
      }

      if (!Number.isFinite(Number(item.quantity)) || Number(item.quantity) < 1) {
        return `quantity must be at least 1 at vendorOrders[${segmentIndex}].items[${itemIndex}]`;
      }

      if (!Number.isFinite(Number(item.unitPrice)) || Number(item.unitPrice) < 0) {
        return `unitPrice must be a valid number at vendorOrders[${segmentIndex}].items[${itemIndex}]`;
      }
    }
  }

  // Allow vendorOrders[].vendor to be either a Vendor userId or a StoreId.
  const resolution = await resolveVendorOrdersVendorIds(vendorOrders);
  if (!resolution.isValid) {
    return resolution.message;
  }

  return null;
};

const formatOrderPayload = (payload, buyerId, orderNumber, appliedCoupon, paymentRecord) => {
  const baseVendorOrders = payload.vendorOrders.map((segment) => ({
    vendor: segment.vendor,
    status: "Placed",
    discountAmount: Number(segment.discountAmount) || 0,
    shippingFee: Number(segment.shippingFee) || 0,
    estimatedDelivery: segment.estimatedDelivery,
    trackingHistory: [
      {
        status: "Placed",
        note: "Order placed",
        changedBy: buyerId,
      },
    ],
    items: segment.items.map((item) => ({
      productId: String(item.productId).trim(),
      productName: String(item.productName).trim(),
      imageUrl: item.imageUrl || "",
      variant: {
        size: item.variant?.size || "",
        color: item.variant?.color || "",
        sku: item.variant?.sku || "",
      },
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
    })),
  }));

  const vendorOrders = applyCouponDiscountToVendorOrders(
    baseVendorOrders,
    appliedCoupon?.discountAmount || 0
  );

  return {
    orderNumber,
    buyer: buyerId,
    shippingAddress: {
      fullName: payload.shippingAddress.fullName,
      phone: payload.shippingAddress.phone,
      line1: payload.shippingAddress.line1,
      line2: payload.shippingAddress.line2 || "",
      city: payload.shippingAddress.city,
      state: payload.shippingAddress.state || "",
      postalCode: payload.shippingAddress.postalCode || "",
      country: payload.shippingAddress.country,
    },
    couponCode: appliedCoupon?.coupon?.code || normalizeCouponCode(payload.couponCode),
    payment: {
      method: paymentRecord.amount?.paymentMethod || "Card",
      status: paymentRecord.status === "paid" ? "Paid" : "Pending",
      transactionId: paymentRecord.stripePaymentIntentId || "",
      paidAt: paymentRecord.paymentDate,
    },
    vendorOrders,
  };
};

export const createOrder = async (req, res) => {
  try {
    const validationMessage = await validateOrderPayload(req.body);
    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    // Get payment ID from request body
    const { paymentId } = req.body;
    if (!paymentId || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(400).json({
        success: false,
        message: "Valid payment ID is required",
      });
    }

    // Fetch payment record from database
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment record not found",
      });
    }

    // Verify payment belongs to the current user
    if (String(payment.customerId) !== String(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: "This payment does not belong to you",
      });
    }

    // Check if payment status is 'paid' before placing order
    if (payment.status !== "paid") {
      return res.status(400).json({
        success: false,
        message: "Order can only be placed when payment status is 'paid'",
      });
    }

    if (!payment.storePayments || payment.storePayments.length === 0) {
      console.error(" Payment missing storePayments:", payment._id);
      return res.status(400).json({
        success: false,
        message: "Payment missing store information. Please check your cart items.",
      });
    }

    console.log(` Payment validated. Store Payments count: ${payment.storePayments.length}`);

    const couponCode = normalizeCouponCode(req.body.couponCode);
    let appliedCoupon = null;

    if (couponCode) {
      const orderSubtotal = calculateCouponEligibleSubtotal(req.body.vendorOrders);
      const coupon = await Coupon.findOne({ code: couponCode });
      const evaluation = evaluateCoupon({
        coupon,
        userId: req.user._id,
        orderSubtotal,
      });

      if (!evaluation.isValid) {
        return res.status(400).json({
          success: false,
          message: evaluation.message,
        });
      }

      appliedCoupon = {
        coupon,
        discountAmount: evaluation.discountAmount,
      };
    }

    const orderNumber = await createUniqueOrderNumber();

    const vendorResolution = await resolveVendorOrdersVendorIds(req.body.vendorOrders);
    if (!vendorResolution.isValid) {
      return res.status(400).json({
        success: false,
        message: vendorResolution.message,
      });
    }

    const orderPayload = formatOrderPayload(
      {
        ...req.body,
        vendorOrders: vendorResolution.resolvedVendorOrders,
      },
      req.user._id,
      orderNumber,
      appliedCoupon,
      payment
    );

    const order = await Order.create(orderPayload);

    if (appliedCoupon?.coupon) {
      appliedCoupon.coupon.usageCount = Number(appliedCoupon.coupon.usageCount || 0) + 1;
      appliedCoupon.coupon.usedBy.push({
        user: req.user._id,
        order: order._id,
        discountAmount: appliedCoupon.discountAmount,
        usedAt: new Date(),
      });
      await appliedCoupon.coupon.save();
    }

    await order.populate([
      { path: "buyer", select: "fullname email phone role" },
      { path: "vendorOrders.vendor", select: "fullname email phone role" },
    ]);

    // ADD NOTIFICATIONS HERE
    try {
      // 1. Send notification to BUYER
      await notificationService.sendToUser(order.buyer._id, {
        type: 'order_placed',
        title: 'Order Placed Successfully',
        message: `Your order #${order.orderNumber} has been placed successfully.`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.priceSummary.totalAmount,
          paymentStatus: order.payment?.status || 'Pending',
          // Customer fields (for email template)
          customerName: order.buyer.fullname,
    
          // Payment fields (standardized)
          amount: order.priceSummary.totalAmount,
          paymentDate: order.createdAt,
        },
        sendEmail: true,
      });

      // 2. Send notification to each VENDOR (parallel - faster)
        await Promise.all(
          order.vendorOrders.map((vendorOrder) => {
            const itemCount = vendorOrder.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            );

            return notificationService.sendToUser(vendorOrder.vendor._id, {
              type: 'order_placed',
              title: 'New Order Received! 🎉',
              message: `You have received a new order #${order.orderNumber} for ${itemCount} item(s).`,
              data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                vendorOrderId: vendorOrder._id,
                items: vendorOrder.items.map(item => ({
                  name: item.productName,
                  quantity: item.quantity,
                  price: item.unitPrice,
                  total: item.quantity * item.unitPrice
                })),
                totalAmount: vendorOrder.totalAmount,
                customerName: order.buyer.fullname,
                shippingAddress: order.shippingAddress,
              },
              sendEmail: false,
            });
          })
        );

      // 3. Send notification to ADMINS (parallel - faster)
      const admins = await User.find({ role: 'admin' });
      if (admins.length > 0) {
  await Promise.all(
    admins.map(admin =>
      notificationService.sendToUser(admin._id, {
        type: 'order_placed',
        title: 'New Order Received',
        message: `Order #${order.orderNumber} placed by ${order.buyer.fullname}`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerName: order.buyer.fullname,
          totalAmount: order.priceSummary.totalAmount,
        },
        sendEmail: false,
      })
    )
  );
    }
    } catch (notifError) {
      console.error('Notification sending error:', notifError);
      // Don't block order creation if notification fails
    }

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      appliedCoupon: appliedCoupon
        ? {
            code: appliedCoupon.coupon.code,
            discountAmount: appliedCoupon.discountAmount,
          }
        : null,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating order",
      error: error.message,
    });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { status, paymentStatus, search, sort = "newest" } = req.query;

    const query = { buyer: req.user._id };

    if (status && ORDER_STATUSES.includes(status)) {
      query.overallStatus = status;
    }

    if (paymentStatus && PAYMENT_STATUSES.includes(paymentStatus)) {
      query["payment.status"] = paymentStatus;
    }

    if (search && search.trim()) {
      query.$or = [
        { orderNumber: { $regex: search.trim(), $options: "i" } },
        { "vendorOrders.items.productName": { $regex: search.trim(), $options: "i" } },
      ];
    }

    const sortQuery = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .populate("vendorOrders.vendor", "fullname email"),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching buyer orders",
      error: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(orderId)
      .populate("buyer", "fullname email phone role")
      .populate("vendorOrders.vendor", "fullname email phone role")
      .populate("vendorOrders.trackingHistory.changedBy", "fullname email role");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (req.user.role === "Vendor") {
      const access = await getVendorAccessIds(req.user._id);
      const vendorMatchIds = new Set(access.allIds);
      let allowed = order.vendorOrders.some((segment) =>
        vendorMatchIds.has(toIdString(segment.vendor))
      );

      if (!allowed && access.storeIds.length) {
        const productIdSet = await getVendorProductIdSet(access.storeIds);
        allowed = orderHasVendorProducts(order, productIdSet);
      }

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "Access denied for this order",
        });
      }
    } else if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied for this order",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching order",
      error: error.message,
    });
  }
};

export const getOrderTracking = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    const order = await Order.findById(orderId)
      .populate("buyer", "fullname email")
      .populate("vendorOrders.vendor", "fullname email");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (req.user.role === "Vendor") {
      const access = await getVendorAccessIds(req.user._id);
      const vendorMatchIds = new Set(access.allIds);
      let allowed = order.vendorOrders.some((segment) =>
        vendorMatchIds.has(toIdString(segment.vendor))
      );

      if (!allowed && access.storeIds.length) {
        const productIdSet = await getVendorProductIdSet(access.storeIds);
        allowed = orderHasVendorProducts(order, productIdSet);
      }

      if (!allowed) {
        return res.status(403).json({
          success: false,
          message: "Access denied for this order",
        });
      }
    } else if (!canAccessOrder(order, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied for this order",
      });
    }

    const tracking = {
      orderId: order._id,
      orderNumber: order.orderNumber,
      overallStatus: order.overallStatus,
      createdAt: order.createdAt,
      buyer: order.buyer,
      vendorTracking: order.vendorOrders.map((segment) => ({
        vendorOrderId: segment._id,
        vendor: segment.vendor,
        status: segment.status,
        estimatedDelivery: segment.estimatedDelivery,
        trackingHistory: segment.trackingHistory,
      })),
    };

    return res.status(200).json({
      success: true,
      tracking,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching order tracking",
      error: error.message,
    });
  }
};

export const getVendorOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search, sort = "newest" } = req.query;

    const skip = (page - 1) * limit;

    //  DEBUG 1: Vendor ID
    console.log(" Vendor User ID:", req.user._id);

    //  Step 1: Get orders where this vendor exists
    const query = {
      "vendorOrders.vendor": req.user._id,
    };

    //  Search filter
    if (search && search.trim()) {
      query.$or = [
        { orderNumber: { $regex: search.trim(), $options: "i" } },
        { "vendorOrders.items.productName": { $regex: search.trim(), $options: "i" } },
      ];
    }

    console.log(" Query:", JSON.stringify(query, null, 2));

    const sortQuery = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const orders = await Order.find(query)
      .sort(sortQuery)
      .populate("buyer", "fullname email phone")
      .populate("vendorOrders.vendor", "fullname email");

    //  DEBUG 2: Orders found
    console.log(" Orders Found:", orders.length);

    if (orders.length > 0) {
      console.log(
        " Sample Order Vendor IDs:",
        orders[0].vendorOrders.map(v => v.vendor?._id)
      );
    }

    //  Step 2: Extract only this vendor's segment
    const filteredOrders = orders
      .map((order) => {
        const vendorSegment = order.vendorOrders.find(
          (segment) => String(segment.vendor._id) === String(req.user._id)
        );

        //  DEBUG 3: Segment check
        console.log(
          ` Checking Order ${order.orderNumber} → Segment Found:`,
          !!vendorSegment
        );

        if (!vendorSegment) return null;

        //  Status filter (optional)
        if (status && vendorSegment.status !== status) {
          return null;
        }

        return {
          orderId: order._id,
          orderNumber: order.orderNumber,
          buyer: order.buyer,
          createdAt: order.createdAt,
          overallStatus: order.overallStatus,
          paymentStatus: order.payment?.status,

          vendorOrder: {
            vendorOrderId: vendorSegment._id,
            status: vendorSegment.status,
            estimatedDelivery: vendorSegment.estimatedDelivery,
            subtotal: vendorSegment.subtotal,
            shippingFee: vendorSegment.shippingFee,
            discountAmount: vendorSegment.discountAmount,
            totalAmount: vendorSegment.totalAmount,
            itemCount: vendorSegment.items.reduce(
              (sum, item) => sum + item.quantity,
              0
            ),
            items: vendorSegment.items,
            trackingHistory: vendorSegment.trackingHistory,
          },

          shippingAddress: order.shippingAddress,
        };
      })
      .filter(Boolean);

    //  DEBUG 4: Filtered results
    console.log("✅ Filtered Orders Count:", filteredOrders.length);

    //  Step 3: Pagination (manual)
    const total = filteredOrders.length;
    const paginated = filteredOrders.slice(skip, skip + Number(limit));

    return res.status(200).json({
      success: true,
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / limit),
      orders: paginated,
    });
  } catch (error) {
    console.error(" getVendorOrders error:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching vendor orders",
      error: error.message,
    });
  }
};

export const updateVendorOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note, estimatedDelivery } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${ORDER_STATUSES.join(", ")}`,
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const access = await getVendorAccessIds(req.user._id);
    const vendorMatchIds = new Set(access.allIds);

    let productIdSet = new Set();
    let vendorSegment = order.vendorOrders.find((segment) =>
      vendorMatchIds.has(toIdString(segment.vendor))
    );

    if (!vendorSegment && access.storeIds.length) {
      productIdSet = await getVendorProductIdSet(access.storeIds);
      vendorSegment = findVendorSegment(order, vendorMatchIds, productIdSet);
    }

    if (!vendorSegment) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this order",
      });
    }

    //  FIX 3: Prevent duplicate notifications
    if (vendorSegment.status === status) {
      return res.status(400).json({
        success: false,
        message: `Order is already in '${status}' state`,
      });
    }

    if (!canTransitionStatus(vendorSegment.status, status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from '${vendorSegment.status}' to '${status}'`,
        allowedNextStatuses: ORDER_STATUS_TRANSITIONS[vendorSegment.status] || [],
      });
    }

    vendorSegment.status = status;
    if (estimatedDelivery) {
      vendorSegment.estimatedDelivery = estimatedDelivery;
    }
    vendorSegment.trackingHistory.push({
      status,
      note: note?.trim() || "Status updated by vendor",
      changedBy: req.user._id,
      changedAt: new Date(),
    });

    await order.save();

    //  FIX 2 & 3: Notification with try/catch and duplicate prevention already done
    try {
      await order.populate("buyer", "fullname email");

      const statusToNotificationType = {
        Placed: "order_placed",
        Confirmed: "order_confirmed",
        Shipped: "order_shipped",
        Delivered: "order_delivered",
        Cancelled: "order_cancelled",
      };

      await notificationService.sendToUser(order.buyer._id, {
        type: statusToNotificationType[status],
        title: `Order ${status}`,
        message: `Your order #${order.orderNumber} status has been updated to ${status}.`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          status: status,
          customerName: order.buyer.fullname,
          estimatedDelivery: vendorSegment.estimatedDelivery,
          amount: order.priceSummary.totalAmount,
          paymentDate: order.updatedAt,
        },
        sendEmail: true,
      });
    } catch (notifError) {
      console.error("Notification error in updateVendorOrderStatus:", notifError);
      // Don't block API response
    }

    return res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating vendor order status",
      error: error.message,
    });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const {
      status,
      paymentStatus,
      search,
      sort = "newest",
      buyerId,
      vendorId,
    } = req.query;

    const query = {};

    if (status && ORDER_STATUSES.includes(status)) {
      query.overallStatus = status;
    }

    if (paymentStatus && PAYMENT_STATUSES.includes(paymentStatus)) {
      query["payment.status"] = paymentStatus;
    }

    if (buyerId && mongoose.Types.ObjectId.isValid(buyerId)) {
      query.buyer = buyerId;
    }

    if (vendorId && mongoose.Types.ObjectId.isValid(vendorId)) {
      query["vendorOrders.vendor"] = vendorId;
    }

    if (search && search.trim()) {
      query.$or = [
        { orderNumber: { $regex: search.trim(), $options: "i" } },
        { "vendorOrders.items.productName": { $regex: search.trim(), $options: "i" } },
      ];
    }

    const sortQuery = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .populate("buyer", "fullname email phone role")
        .populate("vendorOrders.vendor", "fullname email phone role"),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching all orders",
      error: error.message,
    });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { paymentStatus, transactionId, note } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id",
      });
    }

    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid payment status. Allowed values: ${PAYMENT_STATUSES.join(
          ", "
        )}`,
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const oldPaymentStatus = order.payment.status;

    //  FIX 1: Prevent duplicate notifications (no change)
    if (oldPaymentStatus === paymentStatus) {
      return res.status(200).json({
        success: true,
        message: "Payment status unchanged",
        order,
      });
    }

    // Update payment status
    order.payment.status = paymentStatus;
    if (transactionId) {
      order.payment.transactionId = String(transactionId).trim();
    }
    if (note) {
      order.payment.notes = String(note).trim();
    }
    if (paymentStatus === "Paid" && !order.payment.paidAt) {
      order.payment.paidAt = new Date();
    }

    await order.save();

    // Populate buyer and vendor details for notifications
    await order.populate([
      { path: "buyer", select: "fullname email" },
      { path: "vendorOrders.vendor", select: "fullname email" },
    ]);

    //  FIX 4: Wrap notifications in try/catch to prevent API failure
    try {
      // ─────────────────────────────────────────────
      //  SEND NOTIFICATIONS FOR PAYMENT STATUS CHANGE
      // ─────────────────────────────────────────────

      // 1. Send notification to BUYER
      if (order.buyer) {
        let notificationType, title, message;

        switch (paymentStatus) {
          case "Paid":
            notificationType = "payment_succeeded";
            title = "Payment Successful! ✅";
            message = `Your payment of $${order.priceSummary.totalAmount} for order #${order.orderNumber} has been successfully processed.`;
            break;
          case "Failed":
            notificationType = "payment_failed";
            title = "Payment Failed ❌";
            message = `Your payment of $${order.priceSummary.totalAmount} for order #${order.orderNumber} failed. Please try again.`;
            break;
          case "Pending":
            notificationType = "payment_initiated";
            title = "Payment Pending ⏳";
            message = `Your payment for order #${order.orderNumber} is pending.`;
            break;
          case "Refunded":
            notificationType = "payment_refunded";
            title = "Payment Refunded 💰";
            message = `Your payment of $${order.priceSummary.totalAmount} for order #${order.orderNumber} has been refunded.`;
            break;
          default:
            notificationType = "payment_updated";
            title = "Payment Updated";
            message = `Your payment status for order #${order.orderNumber} has been updated to ${paymentStatus}.`;
        }

        await notificationService.sendToUser(order.buyer._id, {
          type: notificationType,
          title: title,
          message: message,
          data: {
            orderId: order._id,
            orderNumber: order.orderNumber,
            paymentStatus: paymentStatus,
            oldPaymentStatus: oldPaymentStatus,
            amount: order.priceSummary.totalAmount,
            transactionId: transactionId,
            customerName: order.buyer.fullname,  // ✅ ADD THIS
            paymentDate: order.payment.paidAt || order.updatedAt,  // ✅ ADD THIS

          },
          sendEmail: true,
        });
      }

      //  FIX 3: Send to VENDORS in PARALLEL (not sequential)
      if (paymentStatus === "Paid" && order.vendorOrders && order.vendorOrders.length > 0) {
        const vendorPromises = order.vendorOrders.map(async (vendorOrder) => {
          if (vendorOrder.vendor) {
            const itemCount = vendorOrder.items.reduce((sum, item) => sum + item.quantity, 0);

            return notificationService.sendToUser(vendorOrder.vendor._id, {
              type: "payment_received",
              title: "Payment Received! 💰",
              message: `You have received a payment of $${vendorOrder.totalAmount} for order #${order.orderNumber} (${itemCount} item(s)).`,
              data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                vendorOrderId: vendorOrder._id,
                amount: vendorOrder.totalAmount,
                itemCount: itemCount,
                buyerName: order.buyer?.fullname || 'Customer',
                paymentDate: order.payment.paidAt || new Date(),
              },
              sendEmail: true,
            });
          }
          return null;
        }).filter(Boolean);

        await Promise.all(vendorPromises); //  Parallel execution
      }

      // Send notification for REFUND to vendors (also in parallel)
      if (paymentStatus === "Refunded" && order.vendorOrders && order.vendorOrders.length > 0) {
        const refundPromises = order.vendorOrders.map(async (vendorOrder) => {
          if (vendorOrder.vendor) {
            return notificationService.sendToUser(vendorOrder.vendor._id, {
              type: "payment_refunded",
              title: "Payment Refunded",
              message: `A payment of $${vendorOrder.totalAmount} for order #${order.orderNumber} has been refunded.`,
              data: {
                orderId: order._id,
                orderNumber: order.orderNumber,
                amount: vendorOrder.totalAmount,
                buyerName: order.buyer?.fullname || 'Customer',
              },
              sendEmail: true,
            });
          }
          return null;
        }).filter(Boolean);

        await Promise.all(refundPromises); //  Parallel execution
      }

    } catch (notifError) {
      //  FIX 4: Don't block API response if notification fails
      console.error("Payment notification error:", notifError);
    }

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      order,
    });
  } catch (error) {
    console.error("updatePaymentStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating payment status",
      error: error.message,
    });
  }
};

export const adminUpdateVendorOrderStatus = async (req, res) => {
  try {
    const { orderId, vendorId } = req.params;
    const { status, note } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(orderId) ||
      !mongoose.Types.ObjectId.isValid(vendorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid order id or vendor id",
      });
    }

    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${ORDER_STATUSES.join(", ")}`,
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const vendorSegment = order.vendorOrders.find(
      (segment) => toIdString(segment.vendor) === String(vendorId)
    );

    if (!vendorSegment) {
      return res.status(404).json({
        success: false,
        message: "Vendor segment not found in this order",
      });
    }

    //  FIX 3: Prevent duplicate notifications
    if (vendorSegment.status === status) {
      return res.status(400).json({
        success: false,
        message: `Order is already in '${status}' state`,
      });
    }

    vendorSegment.status = status;
    vendorSegment.trackingHistory.push({
      status,
      note: note?.trim() || "Status updated by admin",
      changedBy: req.user._id,
      changedAt: new Date(),
    });

    await order.save();

    //  FIX 2: Notification with try/catch
    try {
      await order.populate("buyer", "fullname email");

      const statusToNotificationType = {
        Placed: "order_placed",
        Confirmed: "order_confirmed",
        Shipped: "order_shipped",
        Delivered: "order_delivered",
        Cancelled: "order_cancelled",
      };

      await notificationService.sendToUser(order.buyer._id, {
        type: statusToNotificationType[status],
        title: `Order ${status}`,
        message: `Your order #${order.orderNumber} status has been updated to ${status}.`,
        data: {
          orderId: order._id,
          orderNumber: order.orderNumber,
          customerName: order.buyer.fullname,
          estimatedDelivery: vendorSegment.estimatedDelivery,
        },
        sendEmail: true,
      });
    } catch (notifError) {
      console.error("Notification error in adminUpdateVendorOrderStatus:", notifError);
      // Don't block API response
    }

    return res.status(200).json({
      success: true,
      message: "Vendor order status updated successfully",
      order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating vendor status by admin",
      error: error.message,
    });
  }
};

// ─────────────────────────────────────────────
// ENRICH CART WITH STORE ID (FIX FOR PAYMENT)
// ─────────────────────────────────────────────
export const enrichCartWithStoreId = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Get user's cart with populated product data
    const cart = await Cart.findOne({ user_id: userId }).populate("items.product_id");
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found"
      });
    }

    if (cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty"
      });
    }

    console.log("\n === Enriching Cart with Store ID ===");
    console.log(`Cart ID: ${cart._id}, Items: ${cart.items.length}`);

    // Enrich items with store_id from populated product.store
    let updated = false;
    for (const item of cart.items) {
      if (!item.store_id && item.product_id?.store) {
        item.store_id = item.product_id.store;
        updated = true;
        console.log(`   Set store_id for product ${item.product_id._id}: ${item.product_id.store}`);
      } else if (item.store_id) {
        console.log(`Item already has store_id: ${item.store_id}`);
      } else {
        console.warn(`Item ${item.product_id._id} has no store info`);
      }
    }

    // Save enriched cart
    if (updated) {
      await cart.save();
      console.log(" Cart saved with enriched store_id values");
    }

    return res.status(200).json({
      success: true,
      message: "Cart enriched successfully with store information",
      updated,
      cartId: cart._id,
      items: cart.items.map(item => ({
        product_id: item.product_id._id,
        store_id: item.store_id,
        quantity: item.quantity,
        price: item.price
      }))
    });

  } catch (error) {
    console.error("enrichCartWithStoreId error:", error);
    return res.status(500).json({
      success: false,
      message: "Error enriching cart",
      error: error.message
    });
  }
};