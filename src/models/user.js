const mongoose = require("mongoose");
const validator = require("validator");

// User schema for Lost & Found platform
// Captures identity, profile, roles, hub memberships, and token balance.
const userSchema = new mongoose.Schema(
  {
    // Unique username for mentions and profile URLs
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
      lowercase: true,
      validate: {
        validator: (v) => /^[a-z0-9_]+$/.test(v),
        message: "Username must be lowercase alphanumerics or underscore",
      },
    },

    // Email for login and notifications
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) throw new Error("Invalid email address");
      },
    },

    // Secure password hash (e.g., bcrypt)
    passwordHash: {
      type: String,
      required: true,
    },

    // Display name for UI
    displayName: {
      type: String,
      trim: true,
      maxlength: 80,
    },

    // Optional primary photo URL (preferred over avatarUrl)
    photoUrl: {
      type: String,
      trim: true,
      validate(value) {
        if (value && !validator.isURL(value))
          throw new Error("Invalid photo URL");
      },
    },

    // Short bio shown on profile
    bio: {
      type: String,
      trim: true,
      maxlength: 280,
    },

    // Legacy token balance (kept for compatibility)
    tokenBalance: {
      type: Number,
      default: 0,
      min: 0,
    },

    // New tokens field with default 100
    tokens: {
      type: Number,
      default: 100,
      min: 0,
    },

    // Global roles, e.g., ADMIN for platform-wide tasks
    roles: {
      type: [String],
      default: ["USER"],
      enum: ["USER", "ADMIN"],
      index: true,
    },

    // Home location for proximity-based suggestions (optional)
    homeLocation: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number], // [lng, lat]
        validate: {
          validator: (arr) => Array.isArray(arr) && arr.length === 2,
          message: "homeLocation.coordinates must be [lng, lat]",
        },
      },
    },

    // Hub memberships with role per hub and join timestamp
    memberships: [
      {
        hubId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Hub",
          required: true,
        },
        role: {
          type: String,
          enum: ["MEMBER", "MODERATOR"],
          default: "MEMBER",
        },
        joinedAt: { type: Date, default: Date.now },
      },
    ],

    // Account status controls (e.g., moderation suspension)
    isSuspended: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Last activity timestamp to drive presence features
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    // Notification preferences
    settings: {
      notifications: {
        email: { type: Boolean, default: true },
        push: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.passwordHash;
        delete ret.__v;
        return ret;
      },
    },
  },
);

// Text index for user search by name and bio
userSchema.index({ displayName: "text", bio: "text" });

// Unique indexes
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ email: 1 }, { unique: true });

// Geo index for homeLocation
userSchema.index({ homeLocation: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
