import express from "express";
import {
  createCoupon,
  deleteCoupon,
  getActiveCoupons,
  getAdminCoupons,
  updateCoupon,
  validateCoupon,
} from "../controllers/couponController.js";
import { isAdmin, requiredSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(requiredSignIn);

// Buyer / authenticated users
router.get("/active", getActiveCoupons);
router.post("/validate", validateCoupon);

// Admin management
router.post("/admin", isAdmin, createCoupon);
router.get("/admin/list", isAdmin, getAdminCoupons);
router.patch("/admin/:couponId", isAdmin, updateCoupon);
router.delete("/admin/:couponId", isAdmin, deleteCoupon);

export default router;
