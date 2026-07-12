const mongoose = require("mongoose");

const tripSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle is required"],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: [true, "Driver is required"],
    },
    origin: {
      type: String,
      required: [true, "Origin is required"],
      trim: true,
    },
    destination: {
      type: String,
      required: [true, "Destination is required"],
      trim: true,
    },
    distance: {
      type: Number,
      min: [0, "Distance must be positive"],
    },
    cargoDescription: {
      type: String,
      trim: true,
      maxlength: [200, "Cargo description cannot exceed 200 characters"],
    },
    cargoWeight: {
      type: Number,
      required: [true, "Cargo weight is required"],
      min: [0.1, "Cargo weight must be positive"],
    },
    cargoUnit: {
      type: String,
      enum: ["tons", "kg"],
      default: "tons",
    },
    scheduledDeparture: {
      type: Date,
      required: [true, "Scheduled departure is required"],
    },
    actualDeparture: {
      type: Date,
    },
    arrival: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["scheduled", "dispatched", "in_progress", "completed", "cancelled"],
      default: "scheduled",
    },
    tripCost: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

tripSchema.index({ status: 1 });
tripSchema.index({ vehicle: 1 });
tripSchema.index({ driver: 1 });
tripSchema.index({ scheduledDeparture: 1 });

module.exports = mongoose.model("Trip", tripSchema);
