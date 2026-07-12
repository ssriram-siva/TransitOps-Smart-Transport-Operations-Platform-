const express = require("express");
const { body, validationResult } = require("express-validator");
const Trip = require("../models/Trip");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
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

// GET /api/trips
router.get("/", protect, async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const filter = {};
    if (status && status !== "all") filter.status = status;
    if (search) {
      filter.$or = [
        { origin: { $regex: search, $options: "i" } },
        { destination: { $regex: search, $options: "i" } },
        { cargoDescription: { $regex: search, $options: "i" } },
      ];
    }

    const trips = await Trip.find(filter)
      .populate("vehicle", "registrationNumber type make model capacityValue capacityUnit")
      .populate("driver", "name phone licenseNumber")
      .sort("-createdAt");

    const summary = await Trip.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const summaryMap = { scheduled: 0, dispatched: 0, in_progress: 0, completed: 0, cancelled: 0 };
    summary.forEach((s) => { summaryMap[s._id] = s.count; });

    res.status(200).json({
      success: true,
      count: trips.length,
      summary: {
        total: trips.length,
        scheduled: summaryMap.scheduled,
        dispatched: summaryMap.dispatched,
        in_progress: summaryMap.in_progress,
        completed: summaryMap.completed,
        cancelled: summaryMap.cancelled,
      },
      trips,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/trips/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate("vehicle", "registrationNumber type make model capacityValue capacityUnit status")
      .populate("driver", "name phone licenseNumber status licenseExpiry");
    if (!trip) {
      return res.status(404).json({ success: false, message: "Trip not found" });
    }
    res.status(200).json({ success: true, trip });
  } catch (error) {
    next(error);
  }
});

// POST /api/trips — Schedule a new trip
router.post(
  "/",
  protect,
  authorize("admin", "dispatcher"),
  [
    body("vehicle").notEmpty().withMessage("Vehicle is required"),
    body("driver").notEmpty().withMessage("Driver is required"),
    body("origin").trim().notEmpty().withMessage("Origin is required"),
    body("destination").trim().notEmpty().withMessage("Destination is required"),
    body("cargoWeight").isFloat({ min: 0.1 }).withMessage("Cargo weight must be positive"),
    body("scheduledDeparture").isISO8601().withMessage("Valid departure date is required"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const { vehicle: vehicleId, driver: driverId, cargoWeight, cargoUnit } = req.body;

      // Check vehicle exists and is available
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ success: false, message: "Vehicle not found" });
      }
      if (vehicle.status !== "available") {
        return res.status(400).json({
          success: false,
          message: `Vehicle is ${vehicle.status.replace("_", " ")} and cannot be dispatched`,
        });
      }

      // Check driver exists and is available
      const driver = await Driver.findById(driverId);
      if (!driver) {
        return res.status(404).json({ success: false, message: "Driver not found" });
      }
      if (driver.status !== "available") {
        return res.status(400).json({
          success: false,
          message: `Driver is ${driver.status.replace("_", " ")} and cannot be dispatched`,
        });
      }
      if (driver.isLicenseExpired()) {
        return res.status(400).json({
          success: false,
          message: "Driver's license has expired and cannot be dispatched",
        });
      }

      // Capacity validation — convert cargo to same unit as vehicle capacity
      let cargoInTons = cargoWeight;
      if (cargoUnit === "kg") cargoInTons = cargoWeight / 1000;

      let vehicleCapacityInTons = vehicle.capacityValue;
      if (vehicle.capacityUnit === "kg") vehicleCapacityInTons = vehicle.capacityValue / 1000;

      if (vehicle.capacityUnit !== "seats" && vehicle.capacityUnit !== "liters" && vehicle.capacityUnit !== "cubic_meters") {
        if (cargoInTons > vehicleCapacityInTons) {
          return res.status(400).json({
            success: false,
            message: `Cargo weight (${cargoWeight} ${cargoUnit}) exceeds vehicle capacity (${vehicle.capacityValue} ${vehicle.capacityUnit})`,
          });
        }
      }

      const trip = await Trip.create(req.body);

      const io = getIO();
      io.to("trips").emit("trip:created", { tripId: trip._id, status: trip.status });
      io.to("dashboard").emit("dashboard:update");

      res.status(201).json({ success: true, trip });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/trips/:id/dispatch
router.put(
  "/:id/dispatch",
  protect,
  authorize("admin", "dispatcher"),
  async (req, res, next) => {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      if (trip.status !== "scheduled") {
        return res.status(400).json({
          success: false,
          message: `Only scheduled trips can be dispatched. Current status: ${trip.status}`,
        });
      }

      // Re-validate vehicle and driver availability
      const vehicle = await Vehicle.findById(trip.vehicle);
      if (!vehicle || vehicle.status !== "available") {
        return res.status(400).json({
          success: false,
          message: "Vehicle is no longer available for dispatch",
        });
      }

      const driver = await Driver.findById(trip.driver);
      if (!driver || driver.status !== "available") {
        return res.status(400).json({
          success: false,
          message: "Driver is no longer available for dispatch",
        });
      }

      if (driver.isLicenseExpired()) {
        return res.status(400).json({
          success: false,
          message: "Driver's license has expired",
        });
      }

      // Update statuses
      trip.status = "in_progress";
      trip.actualDeparture = new Date();
      await trip.save();

      vehicle.status = "on_trip";
      await vehicle.save();

      driver.status = "on_trip";
      driver.totalTrips = (driver.totalTrips || 0) + 1;
      await driver.save();

      const populated = await Trip.findById(trip._id)
        .populate("vehicle", "registrationNumber type make model")
        .populate("driver", "name phone licenseNumber");

      const io = getIO();
      io.to("trips").emit("trip:dispatched", {
        tripId: trip._id,
        vehicleId: vehicle._id,
        registrationNumber: vehicle.registrationNumber,
        driverName: driver.name,
        origin: trip.origin,
        destination: trip.destination,
      });
      io.to("dashboard").emit("dashboard:update");

      res.status(200).json({ success: true, trip: populated });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/trips/:id/complete
router.put(
  "/:id/complete",
  protect,
  authorize("admin", "dispatcher"),
  async (req, res, next) => {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      if (trip.status !== "in_progress") {
        return res.status(400).json({
          success: false,
          message: `Only in-progress trips can be completed. Current status: ${trip.status}`,
        });
      }

      trip.status = "completed";
      trip.arrival = new Date();
      if (req.body.tripCost) trip.tripCost = req.body.tripCost;
      await trip.save();

      // Free up vehicle
      const vehicle = await Vehicle.findById(trip.vehicle);
      if (vehicle) {
        vehicle.status = "available";
        await vehicle.save();
      }

      // Free up driver
      const driver = await Driver.findById(trip.driver);
      if (driver) {
        driver.status = "available";
        await driver.save();
      }

      const populated = await Trip.findById(trip._id)
        .populate("vehicle", "registrationNumber type make model")
        .populate("driver", "name phone licenseNumber");

      const io = getIO();
      io.to("trips").emit("trip:completed", {
        tripId: trip._id,
        vehicleId: vehicle?._id,
        registrationNumber: vehicle?.registrationNumber,
        driverName: driver?.name,
        origin: trip.origin,
        destination: trip.destination,
      });
      io.to("dashboard").emit("dashboard:update");

      res.status(200).json({ success: true, trip: populated });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/trips/:id/cancel
router.put(
  "/:id/cancel",
  protect,
  authorize("admin", "dispatcher"),
  async (req, res, next) => {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }

      if (trip.status === "completed" || trip.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: `Cannot cancel a ${trip.status} trip`,
        });
      }

      const wasDispatched = trip.status === "in_progress" || trip.status === "dispatched";

      trip.status = "cancelled";
      if (req.body.reason) trip.notes = req.body.reason;
      await trip.save();

      // Free up vehicle if it was dispatched
      if (wasDispatched) {
        const vehicle = await Vehicle.findById(trip.vehicle);
        if (vehicle) {
          vehicle.status = "available";
          await vehicle.save();
        }

        const driver = await Driver.findById(trip.driver);
        if (driver) {
          driver.status = "available";
          await driver.save();
        }
      }

      const populated = await Trip.findById(trip._id)
        .populate("vehicle", "registrationNumber type make model")
        .populate("driver", "name phone licenseNumber");

      const io = getIO();
      io.to("trips").emit("trip:cancelled", { tripId: trip._id, origin: trip.origin, destination: trip.destination });
      io.to("dashboard").emit("dashboard:update");

      res.status(200).json({ success: true, trip: populated });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/trips/:id — Edit scheduled trip
router.put(
  "/:id",
  protect,
  authorize("admin", "dispatcher"),
  [
    body("origin").optional().trim().notEmpty().withMessage("Origin cannot be empty"),
    body("destination").optional().trim().notEmpty().withMessage("Destination cannot be empty"),
    body("cargoWeight").optional().isFloat({ min: 0.1 }).withMessage("Cargo weight must be positive"),
  ],
  async (req, res, next) => {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }
      if (trip.status !== "scheduled") {
        return res.status(400).json({
          success: false,
          message: "Only scheduled trips can be edited",
        });
      }

      const updated = await Trip.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      }).populate("vehicle", "registrationNumber type make model")
        .populate("driver", "name phone licenseNumber");

      res.status(200).json({ success: true, trip: updated });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/trips/:id
router.delete(
  "/:id",
  protect,
  authorize("admin", "dispatcher"),
  async (req, res, next) => {
    try {
      const trip = await Trip.findById(req.params.id);
      if (!trip) {
        return res.status(404).json({ success: false, message: "Trip not found" });
      }
      if (trip.status === "in_progress" || trip.status === "dispatched") {
        return res.status(400).json({
          success: false,
          message: "Cannot delete an active trip. Cancel it first.",
        });
      }
      await Trip.findByIdAndDelete(req.params.id);
      res.status(200).json({ success: true, message: "Trip deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
