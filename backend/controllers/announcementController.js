import mongoose from "mongoose";
import Announcement, {
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_STATUSES,
  ANNOUNCEMENT_TYPES,
} from "../models/Announcement.js";

const parsePagination = (query) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const normalizeAudience = (targetAudience) => {
  const raw = Array.isArray(targetAudience)
    ? targetAudience
    : targetAudience
      ? [targetAudience]
      : ["All Users"];

  const cleaned = [...new Set(raw.map((item) => String(item).trim()))].filter(Boolean);

  if (cleaned.length === 0) {
    return ["All Users"];
  }

  return cleaned;
};

const mapAudienceAlias = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "All Users";

  if (normalized === "all" || normalized === "all users") return "All Users";
  if (normalized === "vendors" || normalized === "vendors only" || normalized === "vendor") {
    return "Vendors Only";
  }
  if (normalized === "buyers" || normalized === "buyers only" || normalized === "buyer") {
    return "Buyers Only";
  }
  if (normalized === "premium" || normalized === "premium members") return "Premium Members";
  if (normalized === "new" || normalized === "new members") return "New Members";

  return String(value).trim();
};

const validateAudience = (audience) => {
  return audience.every((item) => ANNOUNCEMENT_AUDIENCES.includes(item));
};

const getAllowedAudienceForUser = (user) => {
  const allowed = ["All Users"];

  if (!user) return allowed;

  if (user.role === "Buyer") {
    allowed.push("Buyers Only");
  }

  if (user.role === "Vendor") {
    allowed.push("Vendors Only");
  }

  if (user.isPremium === true || user.membershipTier?.toLowerCase() === "premium") {
    allowed.push("Premium Members");
  }

  const userCreatedAt = user.createdAt ? new Date(user.createdAt) : null;
  if (userCreatedAt) {
    const daysSinceJoined = (Date.now() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceJoined <= 30) {
      allowed.push("New Members");
    }
  }

  return [...new Set(allowed)];
};

const getLifecycleStatus = (publishDate, expiryDate, currentStatus) => {
  if (currentStatus === "Archived" || currentStatus === "Draft") {
    return currentStatus;
  }

  const now = new Date();
  if (expiryDate && expiryDate <= now) {
    return "Expired";
  }
  if (publishDate && publishDate > now) {
    return "Scheduled";
  }
  return "Published";
};

const ensureLifecycleConsistency = async () => {
  const now = new Date();

  await Announcement.updateMany(
    {
      status: "Scheduled",
      publishDate: { $lte: now },
      $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gt: now } }],
    },
    { $set: { status: "Published", publishedAt: now } }
  );

  await Announcement.updateMany(
    {
      status: { $in: ["Published", "Scheduled"] },
      expiryDate: { $lte: now },
    },
    { $set: { status: "Expired" } }
  );
};

const parseBasePayload = (body) => {
  const title = body.title ? String(body.title).trim() : "";
  const description = body.description ? String(body.description).trim() : "";
  const type = body.type ? String(body.type).trim() : "";
  const rawAudience = body.targetAudience ?? body.audience;
  const targetAudience = normalizeAudience(rawAudience).map(mapAudienceAlias);
  const publishDateInput = body.publishDate ?? body.schedule;
  const expiryDateInput = body.expiryDate ?? body.expiry;
  const publishDate = publishDateInput ? new Date(publishDateInput) : new Date();
  const expiryDate = expiryDateInput ? new Date(expiryDateInput) : undefined;
  const isPinnedFromLegacyPriority = Number(body.priority) > 0;
  const priorityVisibility = {
    isPinned: Boolean(body.priorityVisibility?.isPinned) || isPinnedFromLegacyPriority,
    sendEmailNotification: Boolean(body.priorityVisibility?.sendEmailNotification),
    showHomepageBanner: Boolean(body.priorityVisibility?.showHomepageBanner),
  };

  return {
    title,
    description,
    type,
    targetAudience,
    publishDate,
    expiryDate,
    priorityVisibility,
  };
};

const validateBasePayload = (payload) => {
  if (!payload.title) {
    return "Title is required";
  }

  if (!payload.description) {
    return "Description is required";
  }

  if (!ANNOUNCEMENT_TYPES.includes(payload.type)) {
    return `Invalid announcement type. Allowed values: ${ANNOUNCEMENT_TYPES.join(", ")}`;
  }

  if (!validateAudience(payload.targetAudience)) {
    return `Invalid target audience. Allowed values: ${ANNOUNCEMENT_AUDIENCES.join(", ")}`;
  }

  if (Number.isNaN(payload.publishDate.getTime())) {
    return "Invalid publish date";
  }

  if (payload.expiryDate && Number.isNaN(payload.expiryDate.getTime())) {
    return "Invalid expiry date";
  }

  if (payload.expiryDate && payload.expiryDate <= payload.publishDate) {
    return "Expiry date must be after publish date";
  }

  return null;
};

export const createAnnouncement = async (req, res) => {
  try {
    const payload = parseBasePayload(req.body);
    const validationMessage = validateBasePayload(payload);

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    const publishNow = Boolean(req.body.publishNow);
    const draftMode = Boolean(req.body.saveAsDraft);

    let status = "Scheduled";
    let publishedAt;

    if (draftMode) {
      status = "Draft";
    } else if (publishNow || payload.publishDate <= new Date()) {
      status = "Published";
      publishedAt = new Date();
      payload.publishDate = new Date();
    }

    const announcement = await Announcement.create({
      ...payload,
      status,
      publishedAt,
      createdBy: req.user._id,
      updatedBy: req.user._id,
    });

    await announcement.populate("createdBy", "fullname email role");

    return res.status(201).json({
      success: true,
      message: "Announcement created successfully",
      announcement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error creating announcement",
      error: error.message,
    });
  }
};

export const getAdminAnnouncements = async (req, res) => {
  try {
    await ensureLifecycleConsistency();
    const { page, limit, skip } = parsePagination(req.query);
    const { status, type, audience, search, sort = "newest" } = req.query;

    const query = {};

    if (status && ANNOUNCEMENT_STATUSES.includes(status)) {
      query.status = status;
    }

    if (type && ANNOUNCEMENT_TYPES.includes(type)) {
      query.type = type;
    }

    if (audience && ANNOUNCEMENT_AUDIENCES.includes(audience)) {
      query.targetAudience = audience;
    }

    if (search && search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    let sortQuery = { createdAt: -1 };
    if (sort === "oldest") sortQuery = { createdAt: 1 };
    if (sort === "publishDate") sortQuery = { publishDate: -1 };

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .populate("createdBy", "fullname email role")
        .populate("updatedBy", "fullname email role"),
      Announcement.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      announcements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching admin announcements",
      error: error.message,
    });
  }
};

export const getAnnouncementStats = async (req, res) => {
  try {
    await ensureLifecycleConsistency();

    const [total, published, scheduled, draft, expired, archived] = await Promise.all([
      Announcement.countDocuments(),
      Announcement.countDocuments({ status: "Published" }),
      Announcement.countDocuments({ status: "Scheduled" }),
      Announcement.countDocuments({ status: "Draft" }),
      Announcement.countDocuments({ status: "Expired" }),
      Announcement.countDocuments({ status: "Archived" }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        total,
        published,
        scheduled,
        draft,
        expired,
        archived,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching announcement stats",
      error: error.message,
    });
  }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement id",
      });
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    if (announcement.status === "Archived") {
      return res.status(400).json({
        success: false,
        message: "Archived announcements cannot be edited",
      });
    }

    const payload = parseBasePayload({
      ...announcement.toObject(),
      ...req.body,
      targetAudience: req.body.targetAudience || announcement.targetAudience,
      priorityVisibility: {
        ...(announcement.priorityVisibility || {}),
        ...(req.body.priorityVisibility || {}),
      },
    });

    const validationMessage = validateBasePayload(payload);
    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage,
      });
    }

    const saveAsDraft = Boolean(req.body.saveAsDraft);
    const publishNow = Boolean(req.body.publishNow);

    announcement.title = payload.title;
    announcement.description = payload.description;
    announcement.type = payload.type;
    announcement.targetAudience = payload.targetAudience;
    announcement.priorityVisibility = payload.priorityVisibility;
    announcement.publishDate = payload.publishDate;
    announcement.expiryDate = payload.expiryDate;
    announcement.updatedBy = req.user._id;

    if (saveAsDraft) {
      announcement.status = "Draft";
    } else if (publishNow) {
      announcement.status = "Published";
      announcement.publishDate = new Date();
      announcement.publishedAt = new Date();
    } else {
      const lifecycleStatus = getLifecycleStatus(
        announcement.publishDate,
        announcement.expiryDate,
        announcement.status
      );
      announcement.status = lifecycleStatus;
      if (lifecycleStatus === "Published" && !announcement.publishedAt) {
        announcement.publishedAt = new Date();
      }
    }

    await announcement.save();
    await announcement.populate("updatedBy", "fullname email role");

    return res.status(200).json({
      success: true,
      message: "Announcement updated successfully",
      announcement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error updating announcement",
      error: error.message,
    });
  }
};

export const publishAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement id",
      });
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    announcement.status = "Published";
    announcement.publishDate = new Date();
    announcement.publishedAt = new Date();
    announcement.updatedBy = req.user._id;

    await announcement.save();

    return res.status(200).json({
      success: true,
      message: "Announcement published successfully",
      announcement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error publishing announcement",
      error: error.message,
    });
  }
};

export const archiveAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement id",
      });
    }

    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    announcement.status = "Archived";
    announcement.archivedAt = new Date();
    announcement.updatedBy = req.user._id;
    await announcement.save();

    return res.status(200).json({
      success: true,
      message: "Announcement archived successfully",
      announcement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error archiving announcement",
      error: error.message,
    });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { announcementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement id",
      });
    }

    const announcement = await Announcement.findByIdAndDelete(announcementId);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error deleting announcement",
      error: error.message,
    });
  }
};

export const getPublicAnnouncements = async (req, res) => {
  try {
    await ensureLifecycleConsistency();
    const { page, limit, skip } = parsePagination(req.query);
    const now = new Date();

    const query = {
      status: "Published",
      publishDate: { $lte: now },
      targetAudience: "All Users",
      $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gt: now } }],
    };

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .sort({ "priorityVisibility.isPinned": -1, publishDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Announcement.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      announcements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching public announcements",
      error: error.message,
    });
  }
};

export const getUserAnnouncements = async (req, res) => {
  try {
    await ensureLifecycleConsistency();
    const { page, limit, skip } = parsePagination(req.query);
    const audiences = getAllowedAudienceForUser(req.user);
    const now = new Date();

    const query = {
      status: "Published",
      publishDate: { $lte: now },
      targetAudience: { $in: audiences },
      $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gt: now } }],
    };

    const [announcements, total] = await Promise.all([
      Announcement.find(query)
        .sort({ "priorityVisibility.isPinned": -1, publishDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Announcement.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      announcements,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching user announcements",
      error: error.message,
    });
  }
};

export const getPublicAnnouncementById = async (req, res) => {
  try {
    const { announcementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement id",
      });
    }

    await ensureLifecycleConsistency();
    const now = new Date();

    const announcement = await Announcement.findOne({
      _id: announcementId,
      status: "Published",
      publishDate: { $lte: now },
      targetAudience: "All Users",
      $or: [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gt: now } }],
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    return res.status(200).json({
      success: true,
      announcement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching announcement",
      error: error.message,
    });
  }
};

export const getAnnouncementById = async (req, res) => {
  try {
    const { announcementId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(announcementId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement id",
      });
    }

    await ensureLifecycleConsistency();
    const announcement = await Announcement.findById(announcementId)
      .populate("createdBy", "fullname email role")
      .populate("updatedBy", "fullname email role");

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    if (req.user.role === "admin") {
      return res.status(200).json({
        success: true,
        announcement,
      });
    }

    const allowedAudience = getAllowedAudienceForUser(req.user);
    const now = new Date();
    const isVisibleToUser =
      announcement.status === "Published" &&
      announcement.publishDate <= now &&
      (!announcement.expiryDate || announcement.expiryDate > now) &&
      announcement.targetAudience.some((item) => allowedAudience.includes(item));

    if (!isVisibleToUser) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this announcement",
      });
    }

    return res.status(200).json({
      success: true,
      announcement,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching announcement",
      error: error.message,
    });
  }
};