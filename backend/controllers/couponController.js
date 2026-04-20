import mongoose from "mongoose";
import Coupon, { COUPON_DISCOUNT_TYPES } from "../models/Coupon.js";
import {
  evaluateCoupon,
  normalizeCouponCode,
  roundCurrency,
} from "../utils/couponEngine.js";

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildCouponPayload = (body) => {
  return {
    code: normalizeCouponCode(body.code),
    title: String(body.title || "").trim(),
    description: String(body.description || "").trim(),
    discountType: String(body.discountType || "").trim(),
    discountValue: Number(body.discountValue),
    minOrderAmount: Number(body.minOrderAmount) || 0,
    maxDiscountAmount:
      body.maxDiscountAmount === undefined || body.maxDiscountAmount === null
        ? undefined
        : Number(body.maxDiscountAmount),
    usageLimit:
      body.usageLimit === undefined || body.usageLimit === null
        ? undefined
        : Number(body.usageLimit),
    userUsageLimit:
      body.userUsageLimit === undefined || body.userUsageLimit === null
        ? 1
        : Number(body.userUsageLimit),
    startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
    expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  };
};

const validateCouponPayload = (payload, isPartial = false) => {
  if (!isPartial && !payload.code) {
    return "Coupon code is required";
  }

  if (!isPartial && !payload.title) {
    return "Coupon title is required";
  }

  if (!isPartial && !COUPON_DISCOUNT_TYPES.includes(payload.discountType)) {
    return `Invalid discount type. Allowed values: ${COUPON_DISCOUNT_TYPES.join(", ")}`;
  }

  if (!isPartial && (!Number.isFinite(payload.discountValue) || payload.discountValue <= 0)) {
    return "discountValue must be a number greater than 0";
  }

  if (payload.discountType && !COUPON_DISCOUNT_TYPES.includes(payload.discountType)) {
    return `Invalid discount type. Allowed values: ${COUPON_DISCOUNT_TYPES.join(", ")}`;
  }

  if (
    payload.discountValue !== undefined &&
    (!Number.isFinite(payload.discountValue) || payload.discountValue <= 0)
  ) {
    return "discountValue must be a number greater than 0";
  }

  if (
    payload.discountType === "percentage" &&
    Number.isFinite(payload.discountValue) &&
    payload.discountValue > 100
  ) {
    return "Percentage discount cannot exceed 100";
  }

  if (
    payload.minOrderAmount !== undefined &&
    (!Number.isFinite(payload.minOrderAmount) || payload.minOrderAmount < 0)
  ) {
    return "minOrderAmount must be a positive number";
  }

  if (
    payload.maxDiscountAmount !== undefined &&
    (!Number.isFinite(payload.maxDiscountAmount) || payload.maxDiscountAmount < 0)
  ) {
    return "maxDiscountAmount must be a positive number";
  }

  if (
    payload.usageLimit !== undefined &&
    (!Number.isInteger(payload.usageLimit) || payload.usageLimit < 1)
  ) {
    return "usageLimit must be an integer greater than or equal to 1";
  }

  if (
    payload.userUsageLimit !== undefined &&
    (!Number.isInteger(payload.userUsageLimit) || payload.userUsageLimit < 1)
  ) {
    return "userUsageLimit must be an integer greater than or equal to 1";
  }

  if (payload.startsAt && Number.isNaN(payload.startsAt.getTime())) {
    return "Invalid startsAt date";
  }

  if (payload.expiresAt && Number.isNaN(payload.expiresAt.getTime())) {
    return "Invalid expiresAt date";
  }

  if (payload.startsAt && payload.expiresAt && payload.expiresAt <= payload.startsAt) {
    return "expiresAt must be after startsAt";
  }

  return null;
};

const getCouponLifecycle = (coupon) => {
  const now = new Date();

  if (!coupon.isActive) return "inactive";
  if (coupon.startsAt && new Date(coupon.startsAt) > now) return "upcoming";
  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) return "expired";
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return "exhausted";

  return "active";
};

export const createCoupon = async (req, res) => {
  try {
    const payload = buildCouponPayload(req.body);
    const validationMessage = validateCouponPayload(payload);

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    const existing = await Coupon.findOne({ code: payload.code });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const coupon = await Coupon.create({
      ...payload,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating coupon",
      error: error.message,
    });
  }
};

export const getAdminCoupons = async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, isActive, sort = "newest", lifecycle } = req.query;

    const query = {};

    if (isActive !== undefined) {
      query.isActive = String(isActive) === "true";
    }

    if (search && search.trim()) {
      const keyword = search.trim();
      query.$or = [
        { code: { $regex: keyword, $options: "i" } },
        { title: { $regex: keyword, $options: "i" } },
      ];
    }

    const sortQuery = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

    const [coupons, total] = await Promise.all([
      Coupon.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "fullname email role")
        .populate("updatedBy", "fullname email role"),
      Coupon.countDocuments(query),
    ]);

    const enriched = coupons
      .map((coupon) => ({
        ...coupon.toObject(),
        lifecycle: getCouponLifecycle(coupon),
      }))
      .filter((coupon) => {
        if (!lifecycle) return true;
        return coupon.lifecycle === String(lifecycle).trim().toLowerCase();
      });

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      coupons: enriched,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching coupons",
      error: error.message,
    });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon id",
      });
    }

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    const payload = buildCouponPayload({ ...coupon.toObject(), ...req.body });
    const validationMessage = validateCouponPayload(payload, true);

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    const allowedFields = [
      "code",
      "title",
      "description",
      "discountType",
      "discountValue",
      "minOrderAmount",
      "maxDiscountAmount",
      "usageLimit",
      "userUsageLimit",
      "startsAt",
      "expiresAt",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        coupon[field] = payload[field];
      }
    }

    coupon.updatedBy = req.user._id;
    await coupon.save();

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Error updating coupon",
      error: error.message,
    });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(couponId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coupon id",
      });
    }

    const coupon = await Coupon.findByIdAndDelete(couponId);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting coupon",
      error: error.message,
    });
  }
};

export const getActiveCoupons = async (req, res) => {
  try {
    const now = new Date();

    const query = {
      isActive: true,
      $and: [
        {
          $or: [
            { startsAt: { $exists: false } },
            { startsAt: null },
            { startsAt: { $lte: now } },
          ],
        },
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gte: now } },
          ],
        },
      ],
    };

    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .select("code title description discountType discountValue minOrderAmount maxDiscountAmount usageLimit usageCount userUsageLimit startsAt expiresAt isActive usedBy");

    const activeCoupons = coupons
      .filter((coupon) => {
        if (!coupon.usageLimit) return true;
        return coupon.usageCount < coupon.usageLimit;
      })
      .map((coupon) => {
        const usageByUser = Array.isArray(coupon.usedBy)
          ? coupon.usedBy.filter((entry) => String(entry.user) === String(req.user._id)).length
          : 0;

        return {
          _id: coupon._id,
          code: coupon.code,
          title: coupon.title,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderAmount: roundCurrency(coupon.minOrderAmount),
          maxDiscountAmount: coupon.maxDiscountAmount,
          usageLimit: coupon.usageLimit,
          usageCount: coupon.usageCount,
          userUsageLimit: coupon.userUsageLimit,
          usageByUser,
          startsAt: coupon.startsAt,
          expiresAt: coupon.expiresAt,
        };
      });

    return res.status(200).json({
      success: true,
      coupons: activeCoupons,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching active coupons",
      error: error.message,
    });
  }
};

export const validateCoupon = async (req, res) => {
  try {
    const code = normalizeCouponCode(req.body.code);
    const orderSubtotal = Number(req.body.orderSubtotal);

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    if (!Number.isFinite(orderSubtotal) || orderSubtotal <= 0) {
      return res.status(400).json({
        success: false,
        message: "orderSubtotal must be greater than 0",
      });
    }

    const coupon = await Coupon.findOne({ code });
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

    return res.status(200).json({
      success: true,
      message: evaluation.message,
      data: {
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: evaluation.discountAmount,
        orderSubtotal: roundCurrency(orderSubtotal),
        finalAmount: roundCurrency(orderSubtotal - evaluation.discountAmount),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error validating coupon",
      error: error.message,
    });
  }
};
