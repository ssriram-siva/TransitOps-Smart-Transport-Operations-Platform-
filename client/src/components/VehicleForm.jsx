import { useState, useEffect } from "react";
import { X, Truck, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const vehicleTypes = [
  { value: "truck", label: "Truck" },
  { value: "bus", label: "Bus" },
  { value: "van", label: "Van" },
  { value: "trailer", label: "Trailer" },
  { value: "tanker", label: "Tanker" },
];

const fuelTypes = [
  { value: "diesel", label: "Diesel" },
  { value: "petrol", label: "Petrol" },
  { value: "cng", label: "CNG" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
];

const capacityUnits = [
  { value: "tons", label: "Tons" },
  { value: "kg", label: "Kg" },
  { value: "liters", label: "Liters" },
  { value: "seats", label: "Seats" },
  { value: "cubic_meters", label: "Cubic Meters" },
];

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "on_trip", label: "On Trip" },
  { value: "in_shop", label: "In Shop" },
  { value: "retired", label: "Retired" },
];

const initialState = {
  registrationNumber: "",
  type: "truck",
  make: "",
  model: "",
  year: new Date().getFullYear(),
  capacityValue: "",
  capacityUnit: "tons",
  fuelType: "diesel",
  status: "available",
  insuranceExpiry: "",
  fitnessExpiry: "",
  notes: "",
};

const validators = {
  registrationNumber: (v) => {
    if (!v.trim()) return "Registration number is required";
    if (!/^[A-Z]{2}-\d{2}-[A-Z]{1,4}-\d{3,5}$/i.test(v.trim()))
      return "Must match format: XX-XX-XX-XXXX (e.g. MH-12-AB-1234)";
    return "";
  },
  make: (v) => {
    if (!v.trim()) return "Make is required";
    return "";
  },
  model: (v) => {
    if (!v.trim()) return "Model is required";
    return "";
  },
  year: (v) => {
    if (!v) return "Year is required";
    const y = parseInt(v);
    if (y < 1990 || y > new Date().getFullYear() + 1) return "Invalid year";
    return "";
  },
  capacityValue: (v) => {
    if (!v) return "Capacity is required";
    if (parseFloat(v) <= 0) return "Capacity must be positive";
    return "";
  },
};

function VehicleForm({ isOpen, onClose, vehicle, onSave }) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const isEdit = !!vehicle;

  useEffect(() => {
    if (vehicle) {
      setFormData({
        registrationNumber: vehicle.registrationNumber || "",
        type: vehicle.type || "truck",
        make: vehicle.make || "",
        model: vehicle.model || "",
        year: vehicle.year || new Date().getFullYear(),
        capacityValue: vehicle.capacityValue || "",
        capacityUnit: vehicle.capacityUnit || "tons",
        fuelType: vehicle.fuelType || "diesel",
        status: vehicle.status || "available",
        insuranceExpiry: vehicle.insuranceExpiry
          ? new Date(vehicle.insuranceExpiry).toISOString().split("T")[0]
          : "",
        fitnessExpiry: vehicle.fitnessExpiry
          ? new Date(vehicle.fitnessExpiry).toISOString().split("T")[0]
          : "",
        notes: vehicle.notes || "",
      });
    } else {
      setFormData(initialState);
    }
    setErrors({});
    setTouched({});
  }, [vehicle, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validators[field] ? validators[field](value) : "",
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (validators[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validators[field](formData[field]),
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const allErrors = {};
    let hasError = false;
    for (const [field, validator] of Object.entries(validators)) {
      const err = validator(formData[field]);
      allErrors[field] = err;
      if (err) hasError = true;
    }
    setErrors(allErrors);
    setTouched({ registrationNumber: true, make: true, model: true, year: true, capacityValue: true });

    if (hasError) return;

    setLoading(true);
    try {
      await onSave({
        ...formData,
        registrationNumber: formData.registrationNumber.toUpperCase().trim(),
        capacityValue: parseFloat(formData.capacityValue),
        year: parseInt(formData.year),
        insuranceExpiry: formData.insuranceExpiry || undefined,
        fitnessExpiry: formData.fitnessExpiry || undefined,
        notes: formData.notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      // error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const showError = (field) => errors[field] && touched[field];

  const fieldClass = (field) =>
    `input-field text-sm ${
      showError(field)
        ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-400"
        : ""
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-900">
                {isEdit ? "Edit Vehicle" : "Add New Vehicle"}
              </h2>
              <p className="text-xs text-dark-400">
                {isEdit ? "Update vehicle details" : "Fill in vehicle details"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 transition-colors">
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Registration */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">
              Registration Number <span className="text-danger-500">*</span>
            </label>
            <input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => handleChange("registrationNumber", e.target.value.toUpperCase())}
              onBlur={() => handleBlur("registrationNumber")}
              placeholder="MH-12-AB-1234 or MH-12-ABCD-12345"
              className={fieldClass("registrationNumber")}
              maxLength={15}
            />
            {showError("registrationNumber") && (
              <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.registrationNumber}
              </p>
            )}
          </div>

          {/* Type + Fuel Row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Vehicle Type <span className="text-danger-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className="input-field text-sm"
              >
                {vehicleTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Fuel Type <span className="text-danger-500">*</span>
              </label>
              <select
                value={formData.fuelType}
                onChange={(e) => handleChange("fuelType", e.target.value)}
                className="input-field text-sm"
              >
                {fuelTypes.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Make + Model */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Make <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.make}
                onChange={(e) => handleChange("make", e.target.value)}
                onBlur={() => handleBlur("make")}
                placeholder="Tata, Eicher..."
                className={fieldClass("make")}
              />
              {showError("make") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.make}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Model <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => handleChange("model", e.target.value)}
                onBlur={() => handleBlur("model")}
                placeholder="Prima, Viking..."
                className={fieldClass("model")}
              />
              {showError("model") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.model}
                </p>
              )}
            </div>
          </div>

          {/* Year + Capacity */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Year <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => handleChange("year", e.target.value)}
                onBlur={() => handleBlur("year")}
                min="1990"
                max={new Date().getFullYear() + 1}
                className={fieldClass("year")}
              />
              {showError("year") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.year}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Capacity <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                value={formData.capacityValue}
                onChange={(e) => handleChange("capacityValue", e.target.value)}
                onBlur={() => handleBlur("capacityValue")}
                placeholder="25"
                min="0.1"
                step="0.1"
                className={fieldClass("capacityValue")}
              />
              {showError("capacityValue") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.capacityValue}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Unit
              </label>
              <select
                value={formData.capacityUnit}
                onChange={(e) => handleChange("capacityUnit", e.target.value)}
                className="input-field text-sm"
              >
                {capacityUnits.map((u) => (
                  <option key={u.value} value={u.value}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status (edit only) */}
          {isEdit && (
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="input-field text-sm"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Insurance + Fitness */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Insurance Expiry
              </label>
              <input
                type="date"
                value={formData.insuranceExpiry}
                onChange={(e) => handleChange("insuranceExpiry", e.target.value)}
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Fitness Expiry
              </label>
              <input
                type="date"
                value={formData.fitnessExpiry}
                onChange={(e) => handleChange("fitnessExpiry", e.target.value)}
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes..."
              rows={3}
              className="input-field text-sm resize-none"
              maxLength={500}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-100">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isEdit ? (
                "Update Vehicle"
              ) : (
                "Add Vehicle"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VehicleForm;
