import express from "express";
import {
  adminUpdateVendorOrderStatus,
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  getOrderTracking,
  getVendorOrders,
  updatePaymentStatus,
  updateVendorOrderStatus,
} from "../controllers/orderController.js";
import {
  isAdmin,
  isBuyer,
  isVendor,
  requiredSignIn,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requiredSignIn);

// Buyer APIs
router.post("/", isBuyer, createOrder);
router.get("/my", isBuyer, getMyOrders);

// Vendor APIs
router.get("/vendor/list", isVendor, getVendorOrders);
router.patch("/vendor/:orderId/status", isVendor, updateVendorOrderStatus);

// Admin APIs
router.get("/admin/list", isAdmin, getAllOrders);
router.patch("/admin/:orderId/payment", isAdmin, updatePaymentStatus);
router.patch(
  "/admin/:orderId/vendor/:vendorId/status",
  isAdmin,
  adminUpdateVendorOrderStatus
);

// Shared APIs (Buyer / Vendor / Admin)
router.get("/:orderId/tracking", getOrderTracking);
router.get("/:orderId", getOrderById);

export default router;
