const express = require("express");
const { body, validationResult, param } = require("express-validator");
const Vehicle = require("../models/Vehicle");
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

// GET /api/vehicles
router.get("/", protect, async (req, res, next) => {
  try {
    const { status, type, search } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;
    if (type && type !== "all") filter.type = type;
    if (search) {
      filter.$or = [
        { registrationNumber: { $regex: search, $options: "i" } },
        { make: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
      ];
    }

    const vehicles = await Vehicle.find(filter).sort("-createdAt");

    const summary = await Vehicle.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const summaryMap = { available: 0, on_trip: 0, in_shop: 0, retired: 0 };
    summary.forEach((s) => {
      summaryMap[s._id] = s.count;
    });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      summary: {
        total: vehicles.length,
        available: summaryMap.available,
        on_trip: summaryMap.on_trip,
        in_shop: summaryMap.in_shop,
        retired: summaryMap.retired,
      },
      vehicles,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/vehicles/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }
    res.status(200).json({ success: true, vehicle });
  } catch (error) {
    next(error);
  }
});

// POST /api/vehicles
router.post(
  "/",
  protect,
  authorize("admin", "dispatcher"),
  [
    body("registrationNumber")
      .trim()
      .notEmpty()
      .withMessage("Registration number is required")
      .matches(/^[A-Z]{2}-\d{2}-[A-Z]{1,4}-\d{3,5}$/)
      .withMessage("Registration must match format: XX-XX-XXXX-XXXXX (e.g. MH-12-AB-1234)"),
    body("type")
      .isIn(["truck", "bus", "van", "trailer", "tanker"])
      .withMessage("Invalid vehicle type"),
    body("make").trim().notEmpty().withMessage("Make is required"),
    body("model").trim().notEmpty().withMessage("Model is required"),
    body("year")
      .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
      .withMessage("Invalid manufacturing year"),
    body("capacityValue")
      .isFloat({ min: 0.1 })
      .withMessage("Capacity must be positive"),
    body("capacityUnit")
      .isIn(["tons", "kg", "liters", "seats", "cubic_meters"])
      .withMessage("Invalid capacity unit"),
    body("fuelType")
      .isIn(["diesel", "petrol", "cng", "electric", "hybrid"])
      .withMessage("Invalid fuel type"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const existing = await Vehicle.findOne({
        registrationNumber: req.body.registrationNumber.toUpperCase(),
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "A vehicle with this registration number already exists",
        });
      }

      const vehicle = await Vehicle.create({
        ...req.body,
        registrationNumber: req.body.registrationNumber.toUpperCase(),
      });

      res.status(201).json({ success: true, vehicle });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A vehicle with this registration number already exists",
        });
      }
      next(error);
    }
  }
);

// PUT /api/vehicles/:id
router.put(
  "/:id",
  protect,
  authorize("admin", "dispatcher"),
  [
    body("registrationNumber")
      .optional()
      .trim()
      .matches(/^[A-Z]{2}-\d{2}-[A-Z]{1,4}-\d{3,5}$/)
      .withMessage("Registration must match format: XX-XX-XXXX-XXXXX (e.g. MH-12-AB-1234)"),
    body("type")
      .optional()
      .isIn(["truck", "bus", "van", "trailer", "tanker"])
      .withMessage("Invalid vehicle type"),
    body("make").optional().trim().notEmpty().withMessage("Make cannot be empty"),
    body("model").optional().trim().notEmpty().withMessage("Model cannot be empty"),
    body("year")
      .optional()
      .isInt({ min: 1990, max: new Date().getFullYear() + 1 })
      .withMessage("Invalid manufacturing year"),
    body("capacityValue")
      .optional()
      .isFloat({ min: 0.1 })
      .withMessage("Capacity must be positive"),
    body("capacityUnit")
      .optional()
      .isIn(["tons", "kg", "liters", "seats", "cubic_meters"])
      .withMessage("Invalid capacity unit"),
    body("fuelType")
      .optional()
      .isIn(["diesel", "petrol", "cng", "electric", "hybrid"])
      .withMessage("Invalid fuel type"),
    body("status")
      .optional()
      .isIn(["available", "on_trip", "in_shop", "retired"])
      .withMessage("Invalid status"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      if (req.body.registrationNumber) {
        req.body.registrationNumber = req.body.registrationNumber.toUpperCase();
        const existing = await Vehicle.findOne({
          registrationNumber: req.body.registrationNumber,
          _id: { $ne: req.params.id },
        });
        if (existing) {
          return res.status(400).json({
            success: false,
            message: "A vehicle with this registration number already exists",
          });
        }
      }

      const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!vehicle) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
      }

      res.status(200).json({ success: true, vehicle });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: "A vehicle with this registration number already exists",
        });
      }
      next(error);
    }
  }
);

// DELETE /api/vehicles/:id
router.delete(
  "/:id",
  protect,
  authorize("admin", "dispatcher"),
  async (req, res, next) => {
    try {
      const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
      }
      res.status(200).json({ success: true, message: "Vehicle deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
