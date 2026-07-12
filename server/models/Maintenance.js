const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle is required"],
    },
    type: {
      type: String,
      required: [true, "Maintenance type is required"],
      enum: ["routine", "repair", "breakdown", "inspection"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    scheduledDate: {
      type: Date,
      required: [true, "Scheduled date is required"],
    },
    completedDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["scheduled", "in_progress", "completed"],
      default: "scheduled",
    },
    cost: {
      type: Number,
      min: [0, "Cost cannot be negative"],
    },
    shop: {
      type: String,
      trim: true,
      maxlength: [200, "Shop name cannot exceed 200 characters"],
    },
    technician: {
      type: String,
      trim: true,
      maxlength: [100, "Technician name cannot exceed 100 characters"],
    },
    partsReplaced: [
      {
        type: String,
        trim: true,
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

maintenanceSchema.index({ vehicle: 1 });
maintenanceSchema.index({ status: 1 });
maintenanceSchema.index({ scheduledDate: 1 });

module.exports = mongoose.model("Maintenance", maintenanceSchema);
