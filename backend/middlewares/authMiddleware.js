import jwt from "jsonwebtoken";
import User from "../models/User.js";

// Middleware to check JWT and attach user
export const requiredSignIn = async (req, res, next) => {
  try {
    // Get token from cookie OR Authorization header
    const token =
      req.cookies?.access_token ||
      req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "No token provided",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        message: "User not found",
      });
    }

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Not authorized, token failed",
    });
  }
};

// Admin check
export const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied: Admins only",
    });
  }
  next();
};

// Buyer check
export const isBuyer = (req, res, next) => {
  if (req.user.role !== "Buyer") {
    return res.status(403).json({
      message: "Access denied: Buyers only",
    });
  }
  next();
};

// Vendor check
export const isVendor = (req, res, next) => {
  if (req.user.role !== "Vendor") {
    return res.status(403).json({
      message: "Access denied: Vendors only",
    });
  }
  next();
};

// Admin OR Vendor check
export const isAdminOrVendor = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "Vendor") {
    return res.status(403).json({
      message: "Access denied: Admin or Vendor only",
    });
  }
  next();
};

// Admin OR Buyer check
export const isAdminOrBuyer = (req, res, next) => {
  if (req.user.role !== "admin" && req.user.role !== "Buyer") {
    return res.status(403).json({
      message: "Access denied: Admin or Buyer only",
    });
  }
  next();
};