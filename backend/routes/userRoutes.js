import express from "express";
import {
  register,
  login,
  changePassword,
  viewProfile,
  logout,
  updatePhone,
  getAllUsers,
  getUsersByRole
} from "../controllers/userController.js";
import { requiredSignIn,isAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Private routes (require authentication)
router.get("/profile", requiredSignIn, viewProfile);
router.put("/change-password", requiredSignIn, changePassword);
router.put("/update-phone", requiredSignIn, updatePhone);
router.post("/logout", requiredSignIn, logout);

// Admin routes
// get all users
router.get("/users", requiredSignIn, isAdmin, getAllUsers);

// get users by role (Buyer / Vendor)
router.get("/users/:role", requiredSignIn, isAdmin, getUsersByRole);
export default router;
