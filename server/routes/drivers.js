const express = require("express");
const { body, validationResult } = require("express-validator");
const Driver = require("../models/Driver");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg });
    return false;
  }
  return true;
};

// GET /api/drivers
router.get("/", protect, async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { licenseNumber: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
        { city: { $regex: search, $options: "i" } },
      ];
    }

    const drivers = await Driver.find(filter).sort("-createdAt");

    const summary = await Driver.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const summaryMap = { available: 0, on_trip: 0, suspended: 0, off_duty: 0 };
    summary.forEach((s) => { summaryMap[s._id] = s.count; });

    const expiringCount = await Driver.countDocuments({
      licenseExpiry: {
        $gt: new Date(),
        $lte: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });

    const expiredCount = await Driver.countDocuments({
      licenseExpiry: { $lt: new Date() },
    });

    res.status(200).json({
      success: true,
      count: drivers.length,
      summary: {
        total: drivers.length,
        available: summaryMap.available,
        on_trip: summaryMap.on_trip,
        suspended: summaryMap.suspended,
        off_duty: summaryMap.off_duty,
        licenseExpiring: expiringCount,
        licenseExpired: expiredCount,
      },
      drivers,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/drivers/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }
    res.status(200).json({ success: true, driver });
  } catch (error) {
    next(error);
  }
});

// GET /api/drivers/:id/dispatch-check
router.get("/:id/dispatch-check", protect, async (req, res, next) => {
  try {
    const driver = await Driver.findById(req.params.id);
    if (!driver) {
      return res.status(404).json({ success: false, message: "Driver not found" });
    }
    res.status(200).json({
      success: true,
      canDispatch: driver.canDispatch(),
      reasons: {
        suspended: driver.status === "suspended",
        onTrip: driver.status === "on_trip",
        licenseExpired: driver.isLicenseExpired(),
        licenseExpiringSoon: driver.isLicenseExpiringSoon(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/drivers
router.post(
  "/",
  protect,
  authorize("admin", "dispatcher"),
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("phone")
      .trim()
      .matches(/^[+]?[\d\s\-]{7,15}$/)
      .withMessage("Valid phone number is required"),
    body("licenseNumber")
      .trim()
      .notEmpty()
      .withMessage("License number is required"),
    body("licenseExpiry")
      .isISO8601()
      .withMessage("Valid license expiry date is required"),
    body("email")
      .optional({ checkFalsy: true })
      .isEmail()
      .withMessage("Invalid email format"),
    body("licenseClass")
      .optional()
      .isIn(["LMV", "HMV", "HPMV", "NTL", "Other"])
      .withMessage("Invalid license class"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const existing = await Driver.findOne({
        licenseNumber: req.body.licenseNumber.toUpperCase(),
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "A driver with this license number already exists",
        });
      }

      const driver = await Driver.create({
        ...req.body,
        licenseNumber: req.body.licenseNumber.toUpperCase(),
      });

      res.status(201).json({ success: true, driver });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A driver with this license number already exists",
        });
      }
      next(error);
    }
  }
);

// PUT /api/drivers/:id
router.put(
  "/:id",
  protect,
  authorize("admin", "dispatcher"),
  [
    body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
    body("phone")
      .optional()
      .matches(/^[+]?[\d\s\-]{7,15}$/)
      .withMessage("Invalid phone number"),
    body("licenseNumber")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("License number cannot be empty"),
    body("licenseExpiry")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format"),
    body("status")
      .optional()
      .isIn(["available", "on_trip", "suspended", "off_duty"])
      .withMessage("Invalid status"),
    body("licenseClass")
      .optional()
      .isIn(["LMV", "HMV", "HPMV", "NTL", "Other"])
      .withMessage("Invalid license class"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      if (req.body.licenseNumber) {
        req.body.licenseNumber = req.body.licenseNumber.toUpperCase();
        const existing = await Driver.findOne({
          licenseNumber: req.body.licenseNumber,
          _id: { $ne: req.params.id },
        });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: "A driver with this license number already exists",
          });
        }
      }

      const driver = await Driver.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!driver) {
        return res.status(404).json({ success: false, message: "Driver not found" });
      }

      res.status(200).json({ success: true, driver });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A driver with this license number already exists",
        });
      }
      next(error);
    }
  }
);

// DELETE /api/drivers/:id
router.delete(
  "/:id",
  protect,
  authorize("admin", "dispatcher"),
  async (req, res, next) => {
    try {
      const driver = await Driver.findByIdAndDelete(req.params.id);
      if (!driver) {
        return res.status(404).json({ success: false, message: "Driver not found" });
      }
      res.status(200).json({ success: true, message: "Driver deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
