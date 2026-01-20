const express = require("express");
const jwt = require("jsonwebtoken");
const { userAuth } = require("../middleware/adminAuth");
const authRouter = express.Router();
const User = require("../models/user");
const bcrypt = require("bcrypt");
const { validateSignUpData } = require("../utils/validation");
authRouter.post("/signup", async (req, res) => {
  try {
    // validate request body (username, email, password)
    validateSignUpData(req);

    const { username, email, password, displayName, photoUrl, bio } = req.body;

    // Check uniqueness for username and email
    const existing = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existing) {
      const conflictField =
        existing.username === username ? "username" : "email";
      return res.status(409).json({
        message: `A user with this ${conflictField} already exists`,
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with the new schema fields
    const user = new User({
      username,
      email,
      passwordHash,
      displayName,
      // store photoUrl if provided
      photoUrl,
      bio,
      roles: ["USER"],
    });

    const savedUser = await user.save();

    res.status(201).json({
      message: "User registered successfully",
      user: savedUser.toJSON(),
    });
  } catch (err) {
    res.status(400).json({
      message: "Error registering user",
      error: err.message,
    });
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    const { email, emailId, username, password } = req.body;

    if (!(email || emailId || username) || !password) {
      return res.status(400).json({
        success: false,
        message: "Identifier (email or username) and password are required",
      });
    }

    const identifierEmail = email || emailId;
    const user = await User.findOne({
      $or: [
        identifierEmail ? { email: identifierEmail } : null,
        username ? { username } : null,
      ].filter(Boolean),
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Incorrect password",
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: "Account is suspended",
      });
    }

    const token = jwt.sign(
      { _id: user._id, username: user.username },
      "Arpitttt",
    );

    // set cookie
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: user.toJSON(),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
      error: err.message,
    });
  }
});

authRouter.get("/profile/view", userAuth, async (req, resp) => {
  try {
    const userbyid = req.user;
    resp.send(userbyid);
  } catch (err) {
    resp.status(400).send("ERROR: " + err.message);
  }
});
authRouter.get("/profile", userAuth, async (req, resp) => {
  try {
    const userDoc = req.user;
    return resp.status(200).json(userDoc.toJSON());
  } catch (err) {
    resp.status(400).send("ERROR: " + err.message);
  }
});

authRouter.post("/logout", async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: "lax",
  });
  res.status(200).json({ message: "Logout success" });
});

module.exports = authRouter;
