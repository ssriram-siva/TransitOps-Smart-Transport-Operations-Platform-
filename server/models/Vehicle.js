const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema(
  {
    registrationNumber: {
      type: String,
      required: [true, "Registration number is required"],
      unique: true,
      trim: true,
      uppercase: true,
      match: [
        /^[A-Z]{2}-\d{2}-[A-Z]{1,4}-\d{3,5}$/,
        "Registration must match format: XX-XX-XXXX-XXXXX (e.g. MH-12-AB-1234, MH-12-ABCD-12345)",
      ],
    },
    type: {
      type: String,
      required: [true, "Vehicle type is required"],
      enum: ["truck", "bus", "van", "trailer", "tanker"],
    },
    make: {
      type: String,
      required: [true, "Vehicle make is required"],
      trim: true,
      maxlength: [50, "Make cannot exceed 50 characters"],
    },
    model: {
      type: String,
      required: [true, "Vehicle model is required"],
      trim: true,
      maxlength: [50, "Model cannot exceed 50 characters"],
    },
    year: {
      type: Number,
      required: [true, "Manufacturing year is required"],
      min: [1990, "Year must be 1990 or later"],
      max: [new Date().getFullYear() + 1, "Year cannot be in the future"],
    },
    capacityValue: {
      type: Number,
      required: [true, "Capacity value is required"],
      min: [0, "Capacity must be positive"],
    },
    capacityUnit: {
      type: String,
      required: [true, "Capacity unit is required"],
      enum: ["tons", "kg", "liters", "seats", "cubic_meters"],
    },
    fuelType: {
      type: String,
      required: [true, "Fuel type is required"],
      enum: ["diesel", "petrol", "cng", "electric", "hybrid"],
    },
    status: {
      type: String,
      enum: ["available", "on_trip", "in_shop", "retired"],
      default: "available",
    },
    insuranceExpiry: {
      type: Date,
    },
    fitnessExpiry: {
      type: Date,
    },
    location: {
      lat: { type: Number, default: 28.6139 },
      lng: { type: Number, default: 77.2090 },
      heading: { type: Number, default: 0 },
      speed: { type: Number, default: 0 },
      updatedAt: { type: Date, default: Date.now },
    },
    pathHistory: [
      {
        lat: Number,
        lng: Number,
        speed: Number,
        heading: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

vehicleSchema.index({ status: 1 });
vehicleSchema.index({ type: 1 });

module.exports = mongoose.model("Vehicle", vehicleSchema);
