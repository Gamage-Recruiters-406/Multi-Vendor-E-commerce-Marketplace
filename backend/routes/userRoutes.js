import express from "express";
import {
  register,
  login,
  changePassword,
  viewProfile,
} from "../controllers/userController.js";
import { requiredSignIn } from "../middlewares/authMiddleware.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// Private routes (require authentication)
router.get("/profile", requiredSignIn, viewProfile);
router.put("/change-password", requiredSignIn, changePassword);

export default router;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          
