export const roundCurrency = (value) => Number((Number(value) || 0).toFixed(2));

export const normalizeCouponCode = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

export const calculateCouponDiscount = (coupon, orderSubtotal) => {
  const subtotal = roundCurrency(orderSubtotal);
  if (subtotal <= 0) return 0;

  let discount = 0;

  if (coupon.discountType === "percentage") {
    discount = roundCurrency((subtotal * Number(coupon.discountValue || 0)) / 100);
  } else {
    discount = roundCurrency(coupon.discountValue);
  }

  if (coupon.maxDiscountAmount !== undefined && coupon.maxDiscountAmount !== null) {
    discount = Math.min(discount, roundCurrency(coupon.maxDiscountAmount));
  }

  discount = Math.min(discount, subtotal);
  return roundCurrency(Math.max(0, discount));
};

const getUserUsageCount = (coupon, userId) => {
  if (!userId || !Array.isArray(coupon.usedBy)) return 0;
  const target = String(userId);
  return coupon.usedBy.filter((entry) => String(entry.user) === target).length;
};

export const evaluateCoupon = ({ coupon, userId, orderSubtotal, now = new Date() }) => {
  if (!coupon) {
    return {
      isValid: false,
      message: "Coupon not found",
      discountAmount: 0,
    };
  }

  if (!coupon.isActive) {
    return {
      isValid: false,
      message: "Coupon is inactive",
      discountAmount: 0,
    };
  }

  if (coupon.startsAt && new Date(coupon.startsAt) > now) {
    return {
      isValid: false,
      message: "Coupon is not active yet",
      discountAmount: 0,
    };
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
    return {
      isValid: false,
      message: "Coupon has expired",
      discountAmount: 0,
    };
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return {
      isValid: false,
      message: "Coupon usage limit reached",
      discountAmount: 0,
    };
  }

  const userUsageCount = getUserUsageCount(coupon, userId);
  if (coupon.userUsageLimit && userUsageCount >= coupon.userUsageLimit) {
    return {
      isValid: false,
      message: "You have reached this coupon usage limit",
      discountAmount: 0,
    };
  }

  const subtotal = roundCurrency(orderSubtotal);
  if (subtotal < roundCurrency(coupon.minOrderAmount)) {
    return {
      isValid: false,
      message: `Minimum order amount is ${roundCurrency(coupon.minOrderAmount)}`,
      discountAmount: 0,
    };
  }

  const discountAmount = calculateCouponDiscount(coupon, subtotal);
  if (discountAmount <= 0) {
    return {
      isValid: false,
      message: "Coupon is not applicable for this order",
      discountAmount: 0,
    };
  }

  return {
    isValid: true,
    message: "Coupon applied successfully",
    discountAmount,
    userUsageCount,
  };
};
