import { useState, useEffect, useRef } from "react";
import { X, Fuel, AlertCircle, Truck, Users, Camera, Trash2, Image } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const fuelTypes = [
  { value: "diesel", label: "Diesel" },
  { value: "petrol", label: "Petrol" },
  { value: "cng", label: "CNG" },
  { value: "electric", label: "Electric" },
];

const initialState = {
  vehicle: "",
  driver: "",
  date: new Date().toISOString().split("T")[0],
  fuelType: "diesel",
  quantity: "",
  costPerUnit: "",
  odometer: "",
  fuelStation: "",
  notes: "",
};

const validators = {
  vehicle: (v) => (!v ? "Vehicle is required" : ""),
  quantity: (v) => {
    if (!v) return "Quantity is required";
    if (parseFloat(v) <= 0) return "Must be positive";
    return "";
  },
  costPerUnit: (v) => {
    if (!v) return "Cost per unit is required";
    if (parseFloat(v) < 0) return "Cannot be negative";
    return "";
  },
  date: (v) => (!v ? "Date is required" : ""),
};

function FuelForm({ isOpen, onClose, log, onSave }) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [receiptFile, setReceiptFile] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef(null);

  const isEdit = !!log;
  const { api } = useAuth();

  useEffect(() => {
    if (!isOpen) return;

    setLoadingOptions(true);
    Promise.all([api.get("/vehicles"), api.get("/drivers")])
      .then(([vRes, dRes]) => {
        setVehicles(vRes.data.vehicles || []);
        setDrivers(dRes.data.drivers || []);
      })
      .catch(() => toast.error("Failed to load options"))
      .finally(() => setLoadingOptions(false));

    if (log) {
      setFormData({
        vehicle: log.vehicle?._id || "",
        driver: log.driver?._id || "",
        date: log.date ? new Date(log.date).toISOString().split("T")[0] : "",
        fuelType: log.fuelType || "diesel",
        quantity: log.quantity || "",
        costPerUnit: log.costPerUnit || "",
        odometer: log.odometer || "",
        fuelStation: log.fuelStation || "",
        notes: log.notes || "",
      });
    } else {
      setFormData(initialState);
    }
    setErrors({});
    setTouched({});
    setReceiptFile(null);
    setRemoveImage(false);
    if (log?.receiptImage?.url) {
      setReceiptPreview(log.receiptImage.url);
    } else {
      setReceiptPreview(null);
    }
  }, [log, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field] && validators[field]) {
      setErrors((prev) => ({ ...prev, [field]: validators[field](value) }));
    }
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    if (validators[field]) {
      setErrors((prev) => ({ ...prev, [field]: validators[field](formData[field]) }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }
    setReceiptFile(file);
    setRemoveImage(false);
    const reader = new FileReader();
    reader.onloadend = () => setReceiptPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
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
    setTouched({ vehicle: true, quantity: true, costPerUnit: true, date: true });
    if (hasError) return;

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("vehicle", formData.vehicle);
      fd.append("date", formData.date);
      fd.append("fuelType", formData.fuelType);
      fd.append("quantity", parseFloat(formData.quantity));
      fd.append("costPerUnit", parseFloat(formData.costPerUnit));
      if (formData.driver) fd.append("driver", formData.driver);
      if (formData.odometer) fd.append("odometer", parseFloat(formData.odometer));
      if (formData.fuelStation.trim()) fd.append("fuelStation", formData.fuelStation.trim());
      if (formData.notes.trim()) fd.append("notes", formData.notes.trim());
      if (receiptFile) fd.append("receiptImage", receiptFile);
      if (removeImage) fd.append("removeImage", "true");

      await onSave(fd);
      onClose();
    } catch (err) {
      // handled by parent
    } finally {
      setLoading(false);
    }
  };

  const showError = (field) => errors[field] && touched[field];
  const fieldClass = (field) =>
    `input-field text-sm ${showError(field) ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-400" : ""}`;

  const totalEstimate =
    formData.quantity && formData.costPerUnit
      ? (parseFloat(formData.quantity) * parseFloat(formData.costPerUnit)).toLocaleString("en-IN", { maximumFractionDigits: 0 })
      : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-dark-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Fuel className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-900">
                {isEdit ? "Edit Fuel Log" : "Add Fuel Log"}
              </h2>
              <p className="text-xs text-dark-400">Record fuel purchase details</p>
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
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Driver</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <select
                  value={formData.driver}
                  onChange={(e) => handleChange("driver", e.target.value)}
                  className={`${fieldClass("driver")} pl-10`}
                  disabled={loadingOptions}
                >
                  <option value="">{loadingOptions ? "Loading..." : "Select driver"}</option>
                  {drivers.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Date + Fuel Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Date <span className="text-danger-500">*</span>
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange("date", e.target.value)}
                onBlur={() => handleBlur("date")}
                className={fieldClass("date")}
              />
              {showError("date") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.date}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Fuel Type</label>
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

          {/* Quantity + Cost Per Unit */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Quantity (L) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleChange("quantity", e.target.value)}
                onBlur={() => handleBlur("quantity")}
                placeholder="85"
                min="0.1"
                step="0.1"
                className={fieldClass("quantity")}
              />
              {showError("quantity") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.quantity}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                ₹/Unit <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                value={formData.costPerUnit}
                onChange={(e) => handleChange("costPerUnit", e.target.value)}
                onBlur={() => handleBlur("costPerUnit")}
                placeholder="96.5"
                min="0"
                step="0.1"
                className={fieldClass("costPerUnit")}
              />
              {showError("costPerUnit") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.costPerUnit}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Total</label>
              <div className="input-field text-sm bg-dark-50 font-bold text-dark-800">
                ₹{totalEstimate}
              </div>
            </div>
          </div>

          {/* Odometer + Station */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Odometer (km)</label>
              <input
                type="number"
                value={formData.odometer}
                onChange={(e) => handleChange("odometer", e.target.value)}
                placeholder="125000"
                min="0"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Fuel Station</label>
              <input
                type="text"
                value={formData.fuelStation}
                onChange={(e) => handleChange("fuelStation", e.target.value)}
                placeholder="HP Petrol Pump, Mumbai"
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Receipt Image */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">Receipt / Bill Image</label>
            {receiptPreview ? (
              <div className="relative inline-block">
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="w-full max-h-48 object-contain rounded-xl border border-dark-200 bg-dark-50"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-1.5 bg-danger-500 text-white rounded-lg hover:bg-danger-600 transition-colors shadow-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-dark-200 rounded-xl hover:border-primary-400 hover:bg-primary-50/30 transition-colors cursor-pointer"
              >
                <Camera className="w-8 h-8 text-dark-300 mb-2" />
                <p className="text-sm font-medium text-dark-500">Click to upload receipt</p>
                <p className="text-xs text-dark-400 mt-1">JPG, PNG, WebP up to 5MB</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">Notes</label>
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes..."
              className="input-field text-sm"
              maxLength={500}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-100">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isEdit ? (
                "Update Log"
              ) : (
                "Add Fuel Log"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default FuelForm;
