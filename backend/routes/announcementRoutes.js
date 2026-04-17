import express from "express";
import {
  archiveAnnouncement,
  createAnnouncement,
  deleteAnnouncement,
  getAdminAnnouncements,
  getAnnouncementById,
  getAnnouncementStats,
  getPublicAnnouncementById,
  getPublicAnnouncements,
  getUserAnnouncements,
  publishAnnouncement,
  updateAnnouncement,
} from "../controllers/announcementController.js";
import { isAdmin, requiredSignIn } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public announcement feed
router.get("/public", getPublicAnnouncements);
router.get("/public/:announcementId", getPublicAnnouncementById);

// Authenticated user feed
router.get("/feed", requiredSignIn, getUserAnnouncements);
router.get("/:announcementId", requiredSignIn, getAnnouncementById);

// Admin management
router.post("/admin", requiredSignIn, isAdmin, createAnnouncement);
router.get("/admin/list", requiredSignIn, isAdmin, getAdminAnnouncements);
router.get("/admin/stats", requiredSignIn, isAdmin, getAnnouncementStats);
router.patch("/admin/:announcementId", requiredSignIn, isAdmin, updateAnnouncement);
router.patch(
  "/admin/:announcementId/publish",
  requiredSignIn,
  isAdmin,
  publishAnnouncement
);
router.patch(
  "/admin/:announcementId/archive",
  requiredSignIn,
  isAdmin,
  archiveAnnouncement
);
router.delete(
  "/admin/:announcementId",
  requiredSignIn,
  isAdmin,
  deleteAnnouncement
);

export default router;