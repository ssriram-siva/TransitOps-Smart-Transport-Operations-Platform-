import { useState, useEffect } from "react";
import { X, MapPin, AlertCircle, Truck, Users, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const initialState = {
  vehicle: "",
  driver: "",
  origin: "",
  destination: "",
  distance: "",
  cargoDescription: "",
  cargoWeight: "",
  cargoUnit: "tons",
  scheduledDeparture: "",
  tripCost: "",
  notes: "",
};

const validators = {
  vehicle: (v) => (!v ? "Vehicle is required" : ""),
  driver: (v) => (!v ? "Driver is required" : ""),
  origin: (v) => (!v.trim() ? "Origin is required" : ""),
  destination: (v) => (!v.trim() ? "Destination is required" : ""),
  cargoWeight: (v) => {
    if (!v) return "Cargo weight is required";
    if (parseFloat(v) <= 0) return "Weight must be positive";
    return "";
  },
  scheduledDeparture: (v) => (!v ? "Departure date is required" : ""),
};

function TripForm({ isOpen, onClose, trip, onSave }) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const isEdit = !!trip;
  const { api } = useAuth();

  useEffect(() => {
    if (!isOpen) return;

    setLoadingOptions(true);
    Promise.all([
      api.get("/vehicles?status=available"),
      api.get("/drivers?status=available"),
    ])
      .then(([vRes, dRes]) => {
        setVehicles(vRes.data.vehicles || []);
        setDrivers(dRes.data.drivers || []);
      })
      .catch(() => toast.error("Failed to load options"))
      .finally(() => setLoadingOptions(false));

    if (trip) {
      setFormData({
        vehicle: trip.vehicle?._id || "",
        driver: trip.driver?._id || "",
        origin: trip.origin || "",
        destination: trip.destination || "",
        distance: trip.distance || "",
        cargoDescription: trip.cargoDescription || "",
        cargoWeight: trip.cargoWeight || "",
        cargoUnit: trip.cargoUnit || "tons",
        scheduledDeparture: trip.scheduledDeparture
          ? new Date(trip.scheduledDeparture).toISOString().slice(0, 16)
          : "",
        tripCost: trip.tripCost || "",
        notes: trip.notes || "",
      });
    } else {
      setFormData(initialState);
    }
    setErrors({});
    setTouched({});
  }, [trip, isOpen]);

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
    setTouched({
      vehicle: true,
      driver: true,
      origin: true,
      destination: true,
      cargoWeight: true,
      scheduledDeparture: true,
    });
    if (hasError) return;

    setLoading(true);
    try {
      const payload = {
        vehicle: formData.vehicle,
        driver: formData.driver,
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        cargoWeight: parseFloat(formData.cargoWeight),
        cargoUnit: formData.cargoUnit,
        scheduledDeparture: formData.scheduledDeparture,
      };
      if (formData.distance) payload.distance = parseFloat(formData.distance);
      if (formData.cargoDescription.trim()) payload.cargoDescription = formData.cargoDescription.trim();
      if (formData.tripCost) payload.tripCost = parseFloat(formData.tripCost);
      if (formData.notes.trim()) payload.notes = formData.notes.trim();

      await onSave(payload);
      onClose();
    } catch (err) {
      // handled by parent
    } finally {
      setLoading(false);
    }
  };

  const showError = (field) => errors[field] && touched[field];

  const fieldClass = (field) =>
    `input-field text-sm ${
      showError(field) ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-400" : ""
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-dark-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-900">
                {isEdit ? "Edit Trip" : "Schedule New Trip"}
              </h2>
              <p className="text-xs text-dark-400">
                {isEdit ? "Update trip details" : "Fill in trip details below"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 transition-colors">
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Vehicle + Driver */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Vehicle <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <select
                  value={formData.vehicle}
                  onChange={(e) => handleChange("vehicle", e.target.value)}
                  onBlur={() => handleBlur("vehicle")}
                  className={`${fieldClass("vehicle")} pl-10`}
                  disabled={loadingOptions || isEdit}
                >
                  <option value="">{loadingOptions ? "Loading..." : "Select vehicle"}</option>
                  {vehicles.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.registrationNumber} ({v.make} {v.model})
                    </option>
                  ))}
                </select>
              </div>
              {showError("vehicle") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.vehicle}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Driver <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <select
                  value={formData.driver}
                  onChange={(e) => handleChange("driver", e.target.value)}
                  onBlur={() => handleBlur("driver")}
                  className={`${fieldClass("driver")} pl-10`}
                  disabled={loadingOptions || isEdit}
                >
                  <option value="">{loadingOptions ? "Loading..." : "Select driver"}</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name} ({d.licenseNumber})
                    </option>
                  ))}
                </select>
              </div>
              {showError("driver") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.driver}
                </p>
              )}
            </div>
          </div>

          {/* Origin + Destination */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Origin <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.origin}
                onChange={(e) => handleChange("origin", e.target.value)}
                onBlur={() => handleBlur("origin")}
                placeholder="Mumbai"
                className={fieldClass("origin")}
              />
              {showError("origin") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.origin}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Destination <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.destination}
                onChange={(e) => handleChange("destination", e.target.value)}
                onBlur={() => handleBlur("destination")}
                placeholder="Pune"
                className={fieldClass("destination")}
              />
              {showError("destination") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.destination}
                </p>
              )}
            </div>
          </div>

          {/* Distance + Departure */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Distance (km)</label>
              <input
                type="number"
                value={formData.distance}
                onChange={(e) => handleChange("distance", e.target.value)}
                placeholder="150"
                min="0"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Departure <span className="text-danger-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="datetime-local"
                  value={formData.scheduledDeparture}
                  onChange={(e) => handleChange("scheduledDeparture", e.target.value)}
                  onBlur={() => handleBlur("scheduledDeparture")}
                  className={`${fieldClass("scheduledDeparture")} pl-10`}
                />
              </div>
              {showError("scheduledDeparture") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.scheduledDeparture}
                </p>
              )}
            </div>
          </div>

          {/* Cargo */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Weight <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                value={formData.cargoWeight}
                onChange={(e) => handleChange("cargoWeight", e.target.value)}
                onBlur={() => handleBlur("cargoWeight")}
                placeholder="12"
                min="0.1"
                step="0.1"
                className={fieldClass("cargoWeight")}
              />
              {showError("cargoWeight") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.cargoWeight}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Unit</label>
              <select
                value={formData.cargoUnit}
                onChange={(e) => handleChange("cargoUnit", e.target.value)}
                className="input-field text-sm"
              >
                <option value="tons">Tons</option>
                <option value="kg">Kg</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Cargo Description</label>
              <input
                type="text"
                value={formData.cargoDescription}
                onChange={(e) => handleChange("cargoDescription", e.target.value)}
                placeholder="Electronics"
                className="input-field text-sm"
                maxLength={200}
              />
            </div>
          </div>

          {/* Cost + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Trip Cost (₹)</label>
              <input
                type="number"
                value={formData.tripCost}
                onChange={(e) => handleChange("tripCost", e.target.value)}
                placeholder="15000"
                min="0"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any special instructions..."
                className="input-field text-sm"
                maxLength={500}
              />
            </div>
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
                "Update Trip"
              ) : (
                "Schedule Trip"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TripForm;
