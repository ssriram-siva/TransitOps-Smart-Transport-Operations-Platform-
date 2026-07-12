import { useState, useEffect } from "react";
import { X, Receipt, AlertCircle, Truck, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const categories = [
  { value: "toll", label: "Toll" },
  { value: "repair", label: "Repair" },
  { value: "insurance", label: "Insurance" },
  { value: "parking", label: "Parking" },
  { value: "permit", label: "Permit" },
  { value: "fine", label: "Fine" },
  { value: "other", label: "Other" },
];

const initialState = {
  vehicle: "",
  driver: "",
  date: new Date().toISOString().split("T")[0],
  category: "toll",
  description: "",
  amount: "",
  receiptNumber: "",
  notes: "",
};

const validators = {
  vehicle: (v) => (!v ? "Vehicle is required" : ""),
  description: (v) => (!v.trim() ? "Description is required" : ""),
  amount: (v) => {
    if (!v) return "Amount is required";
    if (parseFloat(v) <= 0) return "Must be positive";
    return "";
  },
  date: (v) => (!v ? "Date is required" : ""),
};

function ExpenseForm({ isOpen, onClose, expense, onSave }) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const isEdit = !!expense;
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

    if (expense) {
      setFormData({
        vehicle: expense.vehicle?._id || "",
        driver: expense.driver?._id || "",
        date: expense.date ? new Date(expense.date).toISOString().split("T")[0] : "",
        category: expense.category || "toll",
        description: expense.description || "",
        amount: expense.amount || "",
        receiptNumber: expense.receiptNumber || "",
        notes: expense.notes || "",
      });
    } else {
      setFormData(initialState);
    }
    setErrors({});
    setTouched({});
  }, [expense, isOpen]);

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
    setTouched({ vehicle: true, description: true, amount: true, date: true });
    if (hasError) return;

    setLoading(true);
    try {
      const payload = {
        vehicle: formData.vehicle,
        date: formData.date,
        category: formData.category,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
      };
      if (formData.driver) payload.driver = formData.driver;
      if (formData.receiptNumber.trim()) payload.receiptNumber = formData.receiptNumber.trim();
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
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <Receipt className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-900">
                {isEdit ? "Edit Expense" : "Add Expense"}
              </h2>
              <p className="text-xs text-dark-400">Record an operational expense</p>
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

          {/* Date + Category */}
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
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Category</label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="input-field text-sm"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description + Amount */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Description <span className="text-danger-500">*</span>
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                onBlur={() => handleBlur("description")}
                placeholder="Mumbai-Pune expressway toll"
                className={fieldClass("description")}
              />
              {showError("description") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.description}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Amount (₹) <span className="text-danger-500">*</span>
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                onBlur={() => handleBlur("amount")}
                placeholder="1250"
                min="0.01"
                step="0.01"
                className={fieldClass("amount")}
              />
              {showError("amount") && (
                <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  {errors.amount}
                </p>
              )}
            </div>
          </div>

          {/* Receipt + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Receipt #</label>
              <input
                type="text"
                value={formData.receiptNumber}
                onChange={(e) => handleChange("receiptNumber", e.target.value)}
                placeholder="RC-2026-001"
                className="input-field text-sm"
              />
            </div>
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
                "Update Expense"
              ) : (
                "Add Expense"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ExpenseForm;
