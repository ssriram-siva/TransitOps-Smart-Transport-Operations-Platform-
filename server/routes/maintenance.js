const express = require("express");
const { body, validationResult } = require("express-validator");
const Maintenance = require("../models/Maintenance");
const Vehicle = require("../models/Vehicle");
const { protect, authorize } = require("../middleware/auth");
const { getIO } = require("../utils/socket");

const router = express.Router();

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg });
    return false;
  }
  return true;
};

// GET /api/maintenance
router.get("/", protect, async (req, res, next) => {
  try {
    const { status, type, search, vehicle } = req.query;
    const filter = {};

    if (status && status !== "all") filter.status = status;
    if (type && type !== "all") filter.type = type;
    if (vehicle) filter.vehicle = vehicle;
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { shop: { $regex: search, $options: "i" } },
      ];
    }

    const records = await Maintenance.find(filter)
      .populate("vehicle", "registrationNumber type make model")
      .sort("-scheduledDate");

    const summary = await Maintenance.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const summaryMap = { scheduled: 0, in_progress: 0, completed: 0 };
    summary.forEach((s) => {
      summaryMap[s._id] = s.count;
    });

    const costAgg = await Maintenance.aggregate([
      { $match: { status: "completed", cost: { $gt: 0 } } },
      { $group: { _id: null, totalCost: { $sum: "$cost" } } },
    ]);
    const totalCost = costAgg.length > 0 ? costAgg[0].totalCost : 0;

    const monthCostAgg = await Maintenance.aggregate([
      {
        $match: {
          status: "completed",
          cost: { $gt: 0 },
          completedDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      { $group: { _id: null, monthCost: { $sum: "$cost" } } },
    ]);
    const monthCost = monthCostAgg.length > 0 ? monthCostAgg[0].monthCost : 0;

    res.status(200).json({
      success: true,
      count: records.length,
      summary: {
        total: records.length,
        scheduled: summaryMap.scheduled,
        in_progress: summaryMap.in_progress,
        completed: summaryMap.completed,
        totalCost,
        monthCost,
      },
      records,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/maintenance/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const record = await Maintenance.findById(req.params.id).populate(
      "vehicle",
      "registrationNumber type make model year status"
    );
    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Maintenance record not found" });
    }
    res.status(200).json({ success: true, record });
  } catch (error) {
    next(error);
  }
});

// POST /api/maintenance — Schedule maintenance
router.post(
  "/",
  protect,
  authorize("admin", "dispatcher"),
  [
    body("vehicle").notEmpty().withMessage("Vehicle is required"),
    body("type")
      .isIn(["routine", "repair", "breakdown", "inspection"])
      .withMessage("Invalid maintenance type"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("scheduledDate")
      .isISO8601()
      .withMessage("Valid scheduled date is required"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const vehicle = await Vehicle.findById(req.body.vehicle);
      if (!vehicle) {
        return res
          .status(404)
          .json({ success: false, message: "Vehicle not found" });
      }

      if (vehicle.status === "retired") {
        return res.status(400).json({
          success: false,
          message: "Cannot schedule maintenance for a retired vehicle",
        });
      }

      const record = await Maintenance.create(req.body);

      // Set vehicle to in_shop when maintenance starts
      if (vehicle.status === "available") {
        vehicle.status = "in_shop";
        await vehicle.save({ validateBeforeSave: false });
      }

      const populated = await Maintenance.findById(record._id).populate(
        "vehicle",
        "registrationNumber type make model"
      );

      const io = getIO();
      io.to("dashboard").emit("dashboard:update");
      io.to("tracking").emit("vehicle:updated", { vehicleId: vehicle._id, status: vehicle.status });

      res.status(201).json({ success: true, record: populated });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/maintenance/:id — Update maintenance record
router.put(
  "/:id",
  protect,
  authorize("admin", "dispatcher"),
  [
    body("type")
      .optional()
      .isIn(["routine", "repair", "breakdown", "inspection"])
      .withMessage("Invalid maintenance type"),
    body("description")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("scheduledDate")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format"),
    body("status")
      .optional()
      .isIn(["scheduled", "in_progress", "completed"])
      .withMessage("Invalid status"),
    body("cost").optional().isFloat({ min: 0 }).withMessage("Cost must be positive"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const existing = await Maintenance.findById(req.params.id);
      if (!existing) {
        return res
          .status(404)
          .json({ success: false, message: "Maintenance record not found" });
      }

      // Handle status transitions
      if (req.body.status === "completed" && existing.status !== "completed") {
        req.body.completedDate = new Date();

        // Return vehicle to available
        const vehicle = await Vehicle.findById(existing.vehicle);
        if (vehicle && vehicle.status === "in_shop") {
          vehicle.status = "available";
          await vehicle.save({ validateBeforeSave: false });
        }
      }

      if (req.body.status === "in_progress" && existing.status === "scheduled") {
        // Ensure vehicle is in_shop
        const vehicle = await Vehicle.findById(existing.vehicle);
        if (vehicle && vehicle.status === "available") {
          vehicle.status = "in_shop";
          await vehicle.save({ validateBeforeSave: false });
        }
      }

      const record = await Maintenance.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      ).populate("vehicle", "registrationNumber type make model");

      const io = getIO();
      io.to("dashboard").emit("dashboard:update");

      res.status(200).json({ success: true, record });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/maintenance/:id
router.delete(
  "/:id",
  protect,
  authorize("admin", "dispatcher"),
  async (req, res, next) => {
    try {
      const record = await Maintenance.findByIdAndDelete(req.params.id);
      if (!record) {
        return res
          .status(404)
          .json({ success: false, message: "Maintenance record not found" });
      }
      res
        .status(200)
        .json({ success: true, message: "Maintenance record deleted" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
