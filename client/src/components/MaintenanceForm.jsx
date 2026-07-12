import { useState, useEffect } from "react";
import { X, Wrench, AlertCircle, Truck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const maintenanceTypes = [
  { value: "routine", label: "Routine Service" },
  { value: "repair", label: "Repair" },
  { value: "breakdown", label: "Breakdown" },
  { value: "inspection", label: "Inspection" },
];

const statusOptions = [
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const initialState = {
  vehicle: "",
  type: "routine",
  description: "",
  scheduledDate: "",
  cost: "",
  shop: "",
  technician: "",
  partsReplaced: "",
  notes: "",
};

const validators = {
  vehicle: (v) => (!v ? "Vehicle is required" : ""),
  description: (v) => (!v.trim() ? "Description is required" : ""),
  scheduledDate: (v) => (!v ? "Scheduled date is required" : ""),
};

function MaintenanceForm({ isOpen, onClose, record, onSave, status: controlledStatus }) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [status, setStatus] = useState("scheduled");

  const isEdit = !!record;
  const { api } = useAuth();

  useEffect(() => {
    if (!isOpen) return;

    setLoadingVehicles(true);
    api
      .get("/vehicles")
      .then((res) => setVehicles(res.data.vehicles || []))
      .catch(() => toast.error("Failed to load vehicles"))
      .finally(() => setLoadingVehicles(false));

    if (record) {
      setFormData({
        vehicle: record.vehicle?._id || "",
        type: record.type || "routine",
        description: record.description || "",
        scheduledDate: record.scheduledDate
          ? new Date(record.scheduledDate).toISOString().split("T")[0]
          : "",
        cost: record.cost || "",
        shop: record.shop || "",
        technician: record.technician || "",
        partsReplaced: (record.partsReplaced || []).join(", "),
        notes: record.notes || "",
      });
      setStatus(record.status || "scheduled");
    } else {
      setFormData(initialState);
      setStatus("scheduled");
    }
    setErrors({});
    setTouched({});
  }, [record, isOpen]);

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
    setTouched({ vehicle: true, description: true, scheduledDate: true });
    if (hasError) return;

    setLoading(true);
    try {
      const payload = {
        vehicle: formData.vehicle,
        type: formData.type,
        description: formData.description.trim(),
        scheduledDate: formData.scheduledDate,
        status,
      };
      if (formData.cost) payload.cost = parseFloat(formData.cost);
      if (formData.shop.trim()) payload.shop = formData.shop.trim();
      if (formData.technician.trim()) payload.technician = formData.technician.trim();
      if (formData.partsReplaced.trim()) {
        payload.partsReplaced = formData.partsReplaced.split(",").map((p) => p.trim()).filter(Boolean);
      }
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
    `input-field text-sm ${showError(field) ? "border-danger-400 focus:ring-danger-500/30 focus:border-danger-400" : ""}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-dark-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-900">
                {isEdit ? "Edit Maintenance" : "Schedule Maintenance"}
              </h2>
              <p className="text-xs text-dark-400">
                {isEdit ? "Update maintenance record" : "Schedule a new maintenance record"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 transition-colors">
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Vehicle */}
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
                disabled={loadingVehicles || isEdit}
              >
                <option value="">{loadingVehicles ? "Loading..." : "Select vehicle"}</option>
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

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Type <span className="text-danger-500">*</span>
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className="input-field text-sm"
              >
                {maintenanceTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="input-field text-sm"
              >
                {statusOptions.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">
              Description <span className="text-danger-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              onBlur={() => handleBlur("description")}
              placeholder="Describe the maintenance work..."
              rows={3}
              className={`${fieldClass("description")} resize-none`}
              maxLength={500}
            />
            {showError("description") && (
              <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Scheduled Date */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">
              Scheduled Date <span className="text-danger-500">*</span>
            </label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => handleChange("scheduledDate", e.target.value)}
              onBlur={() => handleBlur("scheduledDate")}
              className={fieldClass("scheduledDate")}
            />
            {showError("scheduledDate") && (
              <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errors.scheduledDate}
              </p>
            )}
          </div>

          {/* Shop + Technician */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Shop / Garage</label>
              <input
                type="text"
                value={formData.shop}
                onChange={(e) => handleChange("shop", e.target.value)}
                placeholder="Delhi Auto Works"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Technician</label>
              <input
                type="text"
                value={formData.technician}
                onChange={(e) => handleChange("technician", e.target.value)}
                placeholder="Technician name"
                className="input-field text-sm"
              />
            </div>
          </div>

          {/* Cost + Parts */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Cost (₹)</label>
              <input
                type="number"
                value={formData.cost}
                onChange={(e) => handleChange("cost", e.target.value)}
                placeholder="12500"
                min="0"
                className="input-field text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Parts Replaced</label>
              <input
                type="text"
                value={formData.partsReplaced}
                onChange={(e) => handleChange("partsReplaced", e.target.value)}
                placeholder="Brake pads, Oil filter"
                className="input-field text-sm"
              />
            </div>
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
                "Update Record"
              ) : (
                "Schedule Maintenance"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MaintenanceForm;
