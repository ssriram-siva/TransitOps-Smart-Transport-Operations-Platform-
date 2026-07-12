const express = require("express");
const crypto = require("crypto");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const {
  sendEmail,
  welcomeEmail,
  loginNotificationEmail,
  passwordResetEmail,
} = require("../utils/email");

const router = express.Router();

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg });
    return false;
  }
  return true;
};

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
    body("role")
      .optional()
      .isIn(["admin", "dispatcher", "driver", "viewer"])
      .withMessage("Invalid role"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const { name, email, password, role, phone } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User with this email already exists",
        });
      }

      const user = await User.create({
        name,
        email,
        password,
        role: role || "viewer",
        phone,
      });

      const token = user.generateAuthToken();

      // Send welcome email (non-blocking)
      sendEmail(welcomeEmail(user.name, user.email)).catch((err) =>
        console.error("Welcome email failed:", err.message)
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Please provide a valid email"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const { email, password } = req.body;

      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: "Account has been deactivated. Contact administrator.",
        });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });

      const token = user.generateAuthToken();

      // Send login notification email (non-blocking)
      const ip = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
      const userAgent = req.headers["user-agent"] || "";
      sendEmail(loginNotificationEmail(user.name, user.email, ip, userAgent)).catch(
        (err) => console.error("Login notification email failed:", err.message)
      );

      res.status(200).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/forgot-password
router.post(
  "/forgot-password",
  [body("email").isEmail().withMessage("Please provide a valid email")],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        return res.status(200).json({
          success: true,
          message: "If an account exists with that email, a reset link has been sent.",
        });
      }

      const resetToken = user.getResetPasswordToken();
      await user.save({ validateBeforeSave: false });

      const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

      await sendEmail(passwordResetEmail(user.name, user.email, resetUrl));

      res.status(200).json({
        success: true,
        message: "If an account exists with that email, a reset link has been sent.",
      });
    } catch (error) {
      console.error("Forgot password error:", error.message);
      res.status(500).json({
        success: false,
        message: "Email could not be sent. Please try again later.",
      });
    }
  }
);

// PUT /api/auth/reset-password/:token
router.put(
  "/reset-password/:token",
  [
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.token)
        .digest("hex");

      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "Invalid or expired reset token",
        });
      }

      user.password = req.body.password;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();

      const token = user.generateAuthToken();

      res.status(200).json({
        success: true,
        token,
        message: "Password reset successful",
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me
router.get("/me", protect, async (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      phone: req.user.phone,
      isActive: req.user.isActive,
      lastLogin: req.user.lastLogin,
      createdAt: req.user.createdAt,
    },
  });
});

// PUT /api/auth/profile
router.put(
  "/profile",
  protect,
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("phone").optional().trim(),
  ],
  async (req, res, next) => {
    try {
      const { name, phone } = req.body;
      const updateFields = {};
      if (name) updateFields.name = name;
      if (phone !== undefined) updateFields.phone = phone;

      const user = await User.findByIdAndUpdate(req.user._id, updateFields, {
        new: true,
        runValidators: true,
      });

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/auth/password
router.put(
  "/password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const user = await User.findById(req.user._id).select("+password");
      const isMatch = await user.comparePassword(req.body.currentPassword);

      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      user.password = req.body.newPassword;
      await user.save();

      const token = user.generateAuthToken();

      res.status(200).json({
        success: true,
        token,
        message: "Password updated successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

// Admin: GET /api/auth/users
router.get("/users", protect, authorize("admin"), async (req, res, next) => {
  try {
    const users = await User.find().select("-__v").sort("-createdAt");

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
});

// Admin: PUT /api/auth/users/:id/role
router.put(
  "/users/:id/role",
  protect,
  authorize("admin"),
  [
    body("role")
      .isIn(["admin", "dispatcher", "driver", "viewer"])
      .withMessage("Invalid role"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { role: req.body.role },
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Admin: PUT /api/auth/users/:id/status
router.put(
  "/users/:id/status",
  protect,
  authorize("admin"),
  async (req, res, next) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      user.isActive = !user.isActive;
      await user.save({ validateBeforeSave: false });

      res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
