const express = require("express");
const Vehicle = require("../models/Vehicle");
const Trip = require("../models/Trip");
const { protect } = require("../middleware/auth");
const { getIO } = require("../utils/socket");

const router = express.Router();

const MAX_PATH_POINTS = 200;

function computeHeading(prevLat, prevLng, newLat, newLng) {
  const dLng = ((newLng - prevLng) * Math.PI) / 180;
  const lat1 = (prevLat * Math.PI) / 180;
  const lat2 = (newLat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

function computeSpeed(prevLat, prevLng, newLat, newLng, timeDiffMs) {
  const R = 6371000;
  const dLat = ((newLat - prevLat) * Math.PI) / 180;
  const dLng = ((newLng - prevLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((prevLat * Math.PI) / 180) *
      Math.cos((newLat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceM = R * c;
  const timeH = timeDiffMs / 3600000;
  if (timeH <= 0) return 0;
  return Math.round((distanceM / 1000) / timeH);
}

// GET /api/tracking — All vehicle locations + path history
router.get("/", protect, async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ status: { $in: ["available", "on_trip"] } })
      .select("registrationNumber type make model status location pathHistory currentTrip")
      .lean();

    const activeTripIds = vehicles
      .filter((v) => v.status === "on_trip")
      .map((v) => v._id);

    const activeTrips = await Trip.find({
      vehicle: { $in: activeTripIds },
      status: "in_progress",
    })
      .select("vehicle origin destination driver scheduledDeparture cargoDescription cargoWeight cargoUnit")
      .populate("driver", "name phone")
      .lean();

    const tripMap = {};
    activeTrips.forEach((t) => {
      tripMap[t.vehicle.toString()] = t;
    });

    const result = vehicles.map((v) => ({
      _id: v._id,
      registrationNumber: v.registrationNumber,
      type: v.type,
      make: v.make,
      model: v.model,
      status: v.status,
      location: v.location,
      pathHistory: (v.pathHistory || []).map((p) => [p.lat, p.lng, p.heading, p.speed, p.timestamp]),
      currentTrip: tripMap[v._id?.toString()] || null,
    }));

    res.status(200).json({ success: true, vehicles: result });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tracking/:vehicleId/path — Clear path history for a vehicle
router.delete("/:vehicleId/path", protect, async (req, res, next) => {
  try {
    await Vehicle.findByIdAndUpdate(req.params.vehicleId, { $set: { pathHistory: [] } });
    const io = getIO();
    io.to("tracking").emit("vehicle:pathCleared", { vehicleId: req.params.vehicleId });
    res.status(200).json({ success: true, message: "Path cleared" });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/tracking/all/paths — Clear all path histories
router.delete("/all/paths", protect, async (req, res, next) => {
  try {
    await Vehicle.updateMany({}, { $set: { pathHistory: [] } });
    const io = getIO();
    io.to("tracking").emit("all:pathsCleared");
    res.status(200).json({ success: true, message: "All paths cleared" });
  } catch (error) {
    next(error);
  }
});

// PUT /api/tracking/:vehicleId — Update vehicle location
router.put("/:vehicleId", protect, async (req, res, next) => {
  try {
    const { lat, lng, heading: reqHeading, speed: reqSpeed } = req.body;

    const existing = await Vehicle.findById(req.params.vehicleId).select("location pathHistory");
    if (!existing) {
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }

    const prevLat = existing.location?.lat;
    const prevLng = existing.location?.lng;
    const prevTime = existing.location?.updatedAt;
    const newLat = lat ?? 28.6139;
    const newLng = lng ?? 77.2090;

    let heading = reqHeading ?? 0;
    let speed = reqSpeed ?? 0;

    if (prevLat && prevLng && prevTime) {
      const timeDiff = Date.now() - new Date(prevTime).getTime();
      heading = computeHeading(prevLat, prevLng, newLat, newLng);
      speed = computeSpeed(prevLat, prevLng, newLat, newLng, timeDiff);
    }

    const pathPoint = {
      lat: newLat,
      lng: newLng,
      speed,
      heading,
      timestamp: new Date(),
    };

    const updateOps = {
      location: {
        lat: newLat,
        lng: newLng,
        heading,
        speed,
        updatedAt: new Date(),
      },
      $push: {
        pathHistory: {
          $each: [pathPoint],
          $slice: -MAX_PATH_POINTS,
        },
      },
    };

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.vehicleId,
      updateOps,
      { new: true }
    ).select("registrationNumber type make model status location pathHistory");

    const io = getIO();
    io.to("tracking").emit("vehicle:location", {
      vehicleId: vehicle._id,
      registrationNumber: vehicle.registrationNumber,
      type: vehicle.type,
      make: vehicle.make,
      model: vehicle.model,
      status: vehicle.status,
      location: vehicle.location,
      pathPoint: [newLat, newLng, heading, speed],
    });

    res.status(200).json({ success: true, vehicle });
  } catch (error) {
    next(error);
  }
});

// POST /api/tracking/simulate — Simulate movement for all active vehicles
router.post("/simulate", protect, async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ status: "on_trip" }).select(
      "registrationNumber type make model location pathHistory"
    );

    const io = getIO();

    const updates = vehicles.map(async (v) => {
      const prevLat = v.location?.lat || 28.6139;
      const prevLng = v.location?.lng || 77.2090;
      const prevTime = v.location?.updatedAt;

      const lat = prevLat + (Math.random() - 0.48) * 0.008;
      const lng = prevLng + (Math.random() - 0.48) * 0.008;

      let heading = 0;
      let speed = 50 + Math.random() * 40;

      if (prevTime) {
        const timeDiff = Date.now() - new Date(prevTime).getTime();
        heading = computeHeading(prevLat, prevLng, lat, lng);
        speed = computeSpeed(prevLat, prevLng, lat, lng, timeDiff);
        if (speed < 5) speed = 40 + Math.random() * 50;
      }

      const pathPoint = {
        lat,
        lng,
        speed,
        heading,
        timestamp: new Date(),
      };

      const updated = await Vehicle.findByIdAndUpdate(
        v._id,
        {
          location: {
            lat,
            lng,
            heading,
            speed: Math.round(speed),
            updatedAt: new Date(),
          },
          $push: {
            pathHistory: {
              $each: [pathPoint],
              $slice: -MAX_PATH_POINTS,
            },
          },
        },
        { new: true }
      ).select("registrationNumber type make model status location");

      io.to("tracking").emit("vehicle:location", {
        vehicleId: updated._id,
        registrationNumber: updated.registrationNumber,
        type: updated.type,
        make: updated.make,
        model: updated.model,
        status: updated.status,
        location: updated.location,
        pathPoint: [lat, lng, heading, Math.round(speed)],
      });

      return updated;
    });

    await Promise.all(updates);

    res.status(200).json({
      success: true,
      message: `Simulated ${vehicles.length} vehicles`,
      count: vehicles.length,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
