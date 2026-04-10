import mongoose from "mongoose";

export const ANNOUNCEMENT_TYPES = [
  "Offer / Promotion",
  "Feature Update",
  "Maintenance",
  "General Info",
];

export const ANNOUNCEMENT_AUDIENCES = [
  "All Users",
  "Vendors Only",
  "Buyers Only",
  "Premium Members",
  "New Members",
];

export const ANNOUNCEMENT_STATUSES = [
  "Draft",
  "Scheduled",
  "Published",
  "Expired",
  "Archived",
];

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      enum: ANNOUNCEMENT_TYPES,
      required: true,
    },
    targetAudience: {
      type: [
        {
          type: String,
          enum: ANNOUNCEMENT_AUDIENCES,
        },
      ],
      default: ["All Users"],
      validate: {
        validator: (audiences) => Array.isArray(audiences) && audiences.length > 0,
        message: "At least one target audience is required",
      },
    },
    priorityVisibility: {
      isPinned: { type: Boolean, default: false },
      sendEmailNotification: { type: Boolean, default: false },
      showHomepageBanner: { type: Boolean, default: false },
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    expiryDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ANNOUNCEMENT_STATUSES,
      default: "Draft",
    },
    publishedAt: {
      type: Date,
    },
    archivedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

announcementSchema.pre("validate", function (next) {
  if (this.expiryDate && this.publishDate && this.expiryDate <= this.publishDate) {
    this.invalidate("expiryDate", "Expiry date must be after publish date");
  }

  if (this.status === "Archived" || this.status === "Draft") {
    return next();
  }

  const now = new Date();

  if (this.expiryDate && this.expiryDate <= now) {
    this.status = "Expired";
    return next();
  }

  if (this.publishDate && this.publishDate > now) {
    this.status = "Scheduled";
    return next();
  }

  this.status = "Published";
  if (!this.publishedAt) {
    this.publishedAt = now;
  }

  next();
});

announcementSchema.index({ status: 1, publishDate: -1 });
announcementSchema.index({ targetAudience: 1, publishDate: -1 });
announcementSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model("Announcement", announcementSchema);
