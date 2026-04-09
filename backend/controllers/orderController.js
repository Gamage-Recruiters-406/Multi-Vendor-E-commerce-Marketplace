import mongoose from "mongoose";
import Order, { ORDER_STATUSES, PAYMENT_STATUSES } from "../models/Order.js";
import User from "../models/User.js";

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

  const vendorIds = [];

  for (const [segmentIndex, segment] of vendorOrders.entries()) {
    if (!segment.vendor || !mongoose.Types.ObjectId.isValid(segment.vendor)) {
      return `Vendor id is invalid at vendorOrders[${segmentIndex}]`;
    }

    vendorIds.push(segment.vendor);

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

  const uniqueVendorIds = [...new Set(vendorIds.map((id) => String(id)))];
  const vendorCount = await User.countDocuments({
    _id: { $in: uniqueVendorIds },
    role: "Vendor",
  });

  if (vendorCount !== uniqueVendorIds.length) {
    return "One or more vendor ids are invalid or not vendor accounts";
  }

  return null;
};

const formatOrderPayload = (payload, buyerId, orderNumber) => {
  const vendorOrders = payload.vendorOrders.map((segment) => ({
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
    couponCode: payload.couponCode || "",
    payment: {
      method: payload.payment?.method || "Card",
      status: PAYMENT_STATUSES.includes(payload.payment?.status)
        ? payload.payment.status
        : "Pending",
      transactionId: payload.payment?.transactionId || "",
      paidAt: payload.payment?.paidAt,
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

    const orderNumber = await createUniqueOrderNumber();
    const orderPayload = formatOrderPayload(req.body, req.user._id, orderNumber);

    const order = await Order.create(orderPayload);

    await order.populate([
      { path: "buyer", select: "fullname email phone role" },
      { path: "vendorOrders.vendor", select: "fullname email phone role" },
    ]);

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
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

    if (!canAccessOrder(order, req.user)) {
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

    if (!canAccessOrder(order, req.user)) {
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
    const { page, limit, skip } = parsePagination(req.query);
    const { status, paymentStatus, search, sort = "newest" } = req.query;

    const baseQuery = {
      "vendorOrders.vendor": req.user._id,
    };

    if (search && search.trim()) {
      baseQuery.orderNumber = { $regex: search.trim(), $options: "i" };
    }

    const sortQuery = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const orders = await Order.find(baseQuery)
      .sort(sortQuery)
      .populate("buyer", "fullname email phone")
      .populate("vendorOrders.vendor", "fullname email");

    const vendorId = String(req.user._id);

    const flattened = orders
      .map((order) => {
        const segment = order.vendorOrders.find(
          (vendorOrder) => toIdString(vendorOrder.vendor) === vendorId
        );

        if (!segment) return null;

        if (status && ORDER_STATUSES.includes(status) && segment.status !== status) {
          return null;
        }

        if (
          paymentStatus &&
          PAYMENT_STATUSES.includes(paymentStatus) &&
          order.payment.status !== paymentStatus
        ) {
          return null;
        }

        return {
          orderId: order._id,
          orderNumber: order.orderNumber,
          buyer: order.buyer,
          createdAt: order.createdAt,
          overallStatus: order.overallStatus,
          paymentStatus: order.payment.status,
          vendorOrder: {
            vendorOrderId: segment._id,
            status: segment.status,
            estimatedDelivery: segment.estimatedDelivery,
            subtotal: segment.subtotal,
            shippingFee: segment.shippingFee,
            discountAmount: segment.discountAmount,
            totalAmount: segment.totalAmount,
            itemCount: segment.items.reduce((sum, item) => sum + item.quantity, 0),
            items: segment.items,
            trackingHistory: segment.trackingHistory,
          },
          shippingAddress: order.shippingAddress,
        };
      })
      .filter(Boolean);

    const total = flattened.length;
    const paginated = flattened.slice(skip, skip + limit);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      orders: paginated,
    });
  } catch (error) {
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

    const vendorSegment = order.vendorOrders.find(
      (segment) => toIdString(segment.vendor) === String(req.user._id)
    );

    if (!vendorSegment) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this order",
      });
    }

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

    return res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      order,
    });
  } catch (error) {
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
