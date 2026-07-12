const mongoose = require("mongoose");

const fuelLogSchema = new mongoose.Schema(
  {
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "Vehicle is required"],
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
    },
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    fuelType: {
      type: String,
      required: [true, "Fuel type is required"],
      enum: ["diesel", "petrol", "cng", "electric"],
    },
    quantity: {
      type: Number,
      required: [true, "Fuel quantity is required"],
      min: [0.1, "Quantity must be positive"],
    },
    unit: {
      type: String,
      enum: ["liters", "kg", "kwh"],
      default: "liters",
    },
    costPerUnit: {
      type: Number,
      required: [true, "Cost per unit is required"],
      min: [0, "Cost per unit cannot be negative"],
    },
    totalCost: {
      type: Number,
      min: [0, "Total cost cannot be negative"],
    },
    odometer: {
      type: Number,
      min: [0, "Odometer reading must be positive"],
    },
    fuelStation: {
      type: String,
      trim: true,
      maxlength: [200, "Station name cannot exceed 200 characters"],
    },
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
    receiptImage: {
      filename: String,
      originalName: String,
      url: String,
    },
  },
  {
    timestamps: true,
  }
);

fuelLogSchema.pre("save", function (next) {
  if (this.quantity && this.costPerUnit && !this.totalCost) {
    this.totalCost = this.quantity * this.costPerUnit;
  }
  next();
});

fuelLogSchema.index({ vehicle: 1 });
fuelLogSchema.index({ date: -1 });
fuelLogSchema.index({ driver: 1 });

module.exports = mongoose.model("FuelLog", fuelLogSchema);
