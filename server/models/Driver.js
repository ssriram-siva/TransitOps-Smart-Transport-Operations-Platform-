const mongoose = require("mongoose");

const driverSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },
    name: {
      type: String,
      required: [true, "Driver name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
      match: [
        /^[+]?[\d\s\-]{7,15}$/,
        "Please provide a valid phone number",
      ],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please provide a valid email",
      ],
    },
    licenseNumber: {
      type: String,
      required: [true, "License number is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    licenseExpiry: {
      type: Date,
      required: [true, "License expiry date is required"],
    },
    licenseClass: {
      type: String,
      enum: ["LMV", "HMV", "HPMV", "NTL", "Other"],
      default: "HMV",
    },
    dateOfBirth: {
      type: Date,
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    city: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["available", "on_trip", "suspended", "off_duty"],
      default: "available",
    },
    totalTrips: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
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

driverSchema.index({ status: 1 });
driverSchema.index({ licenseExpiry: 1 });
driverSchema.index({ name: "text" });

driverSchema.methods.isLicenseExpired = function () {
  return new Date() > this.licenseExpiry;
};

driverSchema.methods.isLicenseExpiringSoon = function (days = 90) {
  const diff = this.licenseExpiry - new Date();
  return diff > 0 && diff <= days * 24 * 60 * 60 * 1000;
};

driverSchema.methods.canDispatch = function () {
  if (this.status === "suspended") return false;
  if (this.status === "on_trip") return false;
  if (this.isLicenseExpired()) return false;
  return true;
};

module.exports = mongoose.model("Driver", driverSchema);
