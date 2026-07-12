const express = require("express");
const path = require("path");
const fs = require("fs");
const { body, validationResult } = require("express-validator");
const FuelLog = require("../models/FuelLog");
const { protect, authorize } = require("../middleware/auth");
const { getIO } = require("../utils/socket");
const upload = require("../middleware/upload");

const router = express.Router();

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg });
    return false;
  }
  return true;
};

// GET /api/fuel
router.get("/", protect, async (req, res, next) => {
  try {
    const { fuelType, search, vehicle, startDate, endDate } = req.query;
    const filter = {};

    if (fuelType && fuelType !== "all") filter.fuelType = fuelType;
    if (vehicle) filter.vehicle = vehicle;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { fuelStation: { $regex: search, $options: "i" } },
        { notes: { $regex: search, $options: "i" } },
      ];
    }

    const logs = await FuelLog.find(filter)
      .populate("vehicle", "registrationNumber type make model")
      .populate("driver", "name")
      .sort("-date");

    const summary = await FuelLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalQuantity: { $sum: "$quantity" },
          totalCost: { $sum: "$totalCost" },
          count: { $sum: 1 },
        },
      },
    ]);

    const byFuelType = await FuelLog.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$fuelType",
          totalQuantity: { $sum: "$quantity" },
          totalCost: { $sum: "$totalCost" },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthSummary = await FuelLog.aggregate([
      {
        $match: {
          ...filter,
          date: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      {
        $group: {
          _id: null,
          monthCost: { $sum: "$totalCost" },
          monthQuantity: { $sum: "$quantity" },
        },
      },
    ]);

    const fuelTypeMap = {};
    byFuelType.forEach((f) => {
      fuelTypeMap[f._id] = { quantity: f.totalQuantity, cost: f.totalCost, count: f.count };
    });

    res.status(200).json({
      success: true,
      count: logs.length,
      summary: {
        total: logs.length,
        totalQuantity: summary.length > 0 ? summary[0].totalQuantity : 0,
        totalCost: summary.length > 0 ? summary[0].totalCost : 0,
        monthCost: monthSummary.length > 0 ? monthSummary[0].monthCost : 0,
        monthQuantity: monthSummary.length > 0 ? monthSummary[0].monthQuantity : 0,
        byFuelType: fuelTypeMap,
      },
      logs,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/fuel/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const log = await FuelLog.findById(req.params.id)
      .populate("vehicle", "registrationNumber type make model")
      .populate("driver", "name phone");
    if (!log) {
      return res.status(404).json({ success: false, message: "Fuel log not found" });
    }
    res.status(200).json({ success: true, log });
  } catch (error) {
    next(error);
  }
});

// POST /api/fuel
router.post(
  "/",
  protect,
  authorize("admin", "dispatcher"),
  upload.single("receiptImage"),
  [
    body("vehicle").notEmpty().withMessage("Vehicle is required"),
    body("fuelType")
      .isIn(["diesel", "petrol", "cng", "electric"])
      .withMessage("Invalid fuel type"),
    body("quantity").isFloat({ min: 0.1 }).withMessage("Quantity must be positive"),
    body("costPerUnit").isFloat({ min: 0 }).withMessage("Cost per unit must be positive"),
    body("date").isISO8601().withMessage("Valid date is required"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const totalCost = req.body.quantity * req.body.costPerUnit;
      const logData = { ...req.body, totalCost };

      if (req.file) {
        logData.receiptImage = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: `/uploads/fuel-receipts/${req.file.filename}`,
        };
      }

      const log = await FuelLog.create(logData);

      const populated = await FuelLog.findById(log._id)
        .populate("vehicle", "registrationNumber type make model")
        .populate("driver", "name");

      const io = getIO();
      io.to("dashboard").emit("dashboard:update");

      res.status(201).json({ success: true, log: populated });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/fuel/:id
router.put(
  "/:id",
  protect,
  authorize("admin", "dispatcher"),
  upload.single("receiptImage"),
  [
    body("fuelType")
      .optional()
      .isIn(["diesel", "petrol", "cng", "electric"])
      .withMessage("Invalid fuel type"),
    body("quantity").optional().isFloat({ min: 0.1 }).withMessage("Quantity must be positive"),
    body("costPerUnit").optional().isFloat({ min: 0 }).withMessage("Cost per unit must be positive"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      if (req.body.quantity && req.body.costPerUnit) {
        req.body.totalCost = req.body.quantity * req.body.costPerUnit;
      }

      const existing = await FuelLog.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: "Fuel log not found" });
      }

      if (req.file) {
        if (existing.receiptImage?.filename) {
          const oldPath = path.join(__dirname, "..", "uploads", "fuel-receipts", existing.receiptImage.filename);
          fs.unlink(oldPath, () => {});
        }
        req.body.receiptImage = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          url: `/uploads/fuel-receipts/${req.file.filename}`,
        };
      }

      if (req.body.removeImage === "true" && existing.receiptImage?.filename) {
        const oldPath = path.join(__dirname, "..", "uploads", "fuel-receipts", existing.receiptImage.filename);
        fs.unlink(oldPath, () => {});
        req.body.receiptImage = null;
      }

      const log = await FuelLog.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })
        .populate("vehicle", "registrationNumber type make model")
        .populate("driver", "name");

      res.status(200).json({ success: true, log });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/fuel/:id
router.delete(
  "/:id",
  protect,
  authorize("admin", "dispatcher"),
  async (req, res, next) => {
    try {
      const log = await FuelLog.findByIdAndDelete(req.params.id);
      if (!log) {
        return res.status(404).json({ success: false, message: "Fuel log not found" });
      }
      if (log.receiptImage?.filename) {
        const filePath = path.join(__dirname, "..", "uploads", "fuel-receipts", log.receiptImage.filename);
        fs.unlink(filePath, () => {});
      }
      res.status(200).json({ success: true, message: "Fuel log deleted" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
