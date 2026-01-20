const validator = require("validator");

// Validate signup for new schema: username, email, password
const validateSignUpData = (req) => {
  const { username, email, password, displayName, photoUrl } = req.body;

  if (!username || !email || !password) {
    throw new Error("Username, email, and password are required");
  }

  if (
    typeof username !== "string" ||
    username.length < 3 ||
    username.length > 32 ||
    !/^[a-z0-9_]+$/.test(username)
  ) {
    throw new Error(
      "Username must be 3-32 chars of lowercase letters, numbers, or underscore",
    );
  }

  if (!validator.isEmail(email)) {
    throw new Error("Invalid email address");
  }

  if (!validator.isStrongPassword(password)) {
    throw new Error("Password is not strong enough");
  }

  if (displayName && displayName.length > 80) {
    throw new Error("Display name must be at most 80 characters");
  }

  if (photoUrl && !validator.isURL(photoUrl)) {
    throw new Error("Invalid photo URL");
  }
};

// Validate editable fields for the new schema
const validateEditData = (req) => {
  const allowedFields = [
    "displayName",
    "bio",
    "photoUrl",
    "settings",
    "lastActiveAt",
    "homeLocation",
  ];

  const updates = Object.keys(req.body);

  if (updates.length === 0) {
    throw new Error("No fields provided for update");
  }

  const isValidOperation = updates.every((field) =>
    allowedFields.includes(field),
  );
  if (!isValidOperation) {
    throw new Error("Invalid fields in update request");
  }

  if (req.body.displayName && req.body.displayName.length > 80) {
    throw new Error("Display name must be at most 80 characters");
  }

  if (req.body.bio && req.body.bio.length > 280) {
    throw new Error("Bio must be at most 280 characters");
  }

  if (req.body.photoUrl && !validator.isURL(req.body.photoUrl)) {
    throw new Error("Invalid photo URL");
  }

  if (req.body.settings) {
    const { notifications } = req.body.settings;
    if (notifications) {
      const { email, push } = notifications;
      if (
        (email !== undefined && typeof email !== "boolean") ||
        (push !== undefined && typeof push !== "boolean")
      ) {
        throw new Error("Notification settings must be boolean values");
      }
    }
  }

  if (req.body.homeLocation) {
    const { type, coordinates } = req.body.homeLocation;
    if (type && type !== "Point") {
      throw new Error("homeLocation.type must be 'Point'");
    }
    if (
      !Array.isArray(coordinates) ||
      coordinates.length !== 2 ||
      typeof coordinates[0] !== "number" ||
      typeof coordinates[1] !== "number"
    ) {
      throw new Error("homeLocation.coordinates must be [lng, lat]");
    }
  }

  return true;
};

module.exports = {
  validateSignUpData,
  validateEditData,
};
