import { useState, useEffect } from "react";
import { X, Users, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

const licenseClasses = [
  { value: "LMV", label: "LMV - Light Motor Vehicle" },
  { value: "HMV", label: "HMV - Heavy Motor Vehicle" },
  { value: "HPMV", label: "HPMV - Heavy Passenger Motor Vehicle" },
  { value: "NTL", label: "NTL - National Transport" },
  { value: "Other", label: "Other" },
];

const statusOptions = [
  { value: "available", label: "Available" },
  { value: "on_trip", label: "On Trip" },
  { value: "suspended", label: "Suspended" },
  { value: "off_duty", label: "Off Duty" },
];

const initialState = {
  name: "",
  phone: "",
  email: "",
  licenseNumber: "",
  licenseExpiry: "",
  licenseClass: "HMV",
  dateOfBirth: "",
  address: "",
  city: "",
  status: "available",
  notes: "",
};

const validators = {
  name: (v) => {
    if (!v.trim()) return "Name is required";
    if (v.trim().length < 2) return "Name must be at least 2 characters";
    return "";
  },
  phone: (v) => {
    if (!v.trim()) return "Phone number is required";
    if (!/^[+]?[\d\s\-]{7,15}$/.test(v.trim())) return "Enter a valid phone number";
    return "";
  },
  licenseNumber: (v) => {
    if (!v.trim()) return "License number is required";
    if (v.trim().length < 4) return "License number is too short";
    return "";
  },
  licenseExpiry: (v) => {
    if (!v) return "License expiry date is required";
    return "";
  },
  email: (v) => {
    if (!v) return "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Enter a valid email";
    return "";
  },
};

function DriverForm({ isOpen, onClose, driver, onSave }) {
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const isEdit = !!driver;

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name || "",
        phone: driver.phone || "",
        email: driver.email || "",
        licenseNumber: driver.licenseNumber || "",
        licenseExpiry: driver.licenseExpiry
          ? new Date(driver.licenseExpiry).toISOString().split("T")[0]
          : "",
        licenseClass: driver.licenseClass || "HMV",
        dateOfBirth: driver.dateOfBirth
          ? new Date(driver.dateOfBirth).toISOString().split("T")[0]
          : "",
        address: driver.address || "",
        city: driver.city || "",
        status: driver.status || "available",
        notes: driver.notes || "",
      });
    } else {
      setFormData(initialState);
    }
    setErrors({});
    setTouched({});
  }, [driver, isOpen]);

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
    setTouched({ name: true, phone: true, licenseNumber: true, licenseExpiry: true, email: true });
    if (hasError) return;

    setLoading(true);
    try {
      await onSave({
        ...formData,
        licenseNumber: formData.licenseNumber.toUpperCase().trim(),
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        address: formData.address.trim() || undefined,
        city: formData.city.trim() || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        notes: formData.notes.trim() || undefined,
      });
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
              <Users className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-900">{isEdit ? "Edit Driver" : "Add New Driver"}</h2>
              <p className="text-xs text-dark-400">{isEdit ? "Update driver details" : "Fill in driver details"}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 transition-colors">
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Full Name <span className="text-danger-500">*</span>
              </label>
              <input type="text" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} onBlur={() => handleBlur("name")} placeholder="Rajesh Kumar" className={fieldClass("name")} />
              {showError("name") && <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                Phone <span className="text-danger-500">*</span>
              </label>
              <input type="tel" value={formData.phone} onChange={(e) => handleChange("phone", e.target.value)} onBlur={() => handleBlur("phone")} placeholder="+91-9876543210" className={fieldClass("phone")} />
              {showError("phone") && <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.phone}</p>}
            </div>
          </div>

          {/* Email + City */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Email</label>
              <input type="email" value={formData.email} onChange={(e) => handleChange("email", e.target.value)} onBlur={() => handleBlur("email")} placeholder="rajesh@email.com" className={fieldClass("email")} />
              {showError("email") && <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">City</label>
              <input type="text" value={formData.city} onChange={(e) => handleChange("city", e.target.value)} placeholder="Mumbai" className="input-field text-sm" />
            </div>
          </div>

          {/* License Number + Class + Expiry */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                License Number <span className="text-danger-500">*</span>
              </label>
              <input type="text" value={formData.licenseNumber} onChange={(e) => handleChange("licenseNumber", e.target.value.toUpperCase())} onBlur={() => handleBlur("licenseNumber")} placeholder="MH-12-2021-001234" className={fieldClass("licenseNumber")} />
              {showError("licenseNumber") && <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.licenseNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">License Class</label>
              <select value={formData.licenseClass} onChange={(e) => handleChange("licenseClass", e.target.value)} className="input-field text-sm">
                {licenseClasses.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">
                License Expiry <span className="text-danger-500">*</span>
              </label>
              <input type="date" value={formData.licenseExpiry} onChange={(e) => handleChange("licenseExpiry", e.target.value)} onBlur={() => handleBlur("licenseExpiry")} className={fieldClass("licenseExpiry")} />
              {showError("licenseExpiry") && <p className="flex items-center gap-1.5 mt-1 text-xs text-danger-600"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{errors.licenseExpiry}</p>}
            </div>
          </div>

          {/* DOB + Status (edit only) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-dark-700 mb-1.5">Date of Birth</label>
              <input type="date" value={formData.dateOfBirth} onChange={(e) => handleChange("dateOfBirth", e.target.value)} className="input-field text-sm" />
            </div>
            {isEdit && (
              <div>
                <label className="block text-sm font-semibold text-dark-700 mb-1.5">Status</label>
                <select value={formData.status} onChange={(e) => handleChange("status", e.target.value)} className="input-field text-sm">
                  {statusOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">Address</label>
            <input type="text" value={formData.address} onChange={(e) => handleChange("address", e.target.value)} placeholder="Full address..." className="input-field text-sm" maxLength={200} />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-semibold text-dark-700 mb-1.5">Notes</label>
            <textarea value={formData.notes} onChange={(e) => handleChange("notes", e.target.value)} placeholder="Additional notes..." rows={3} className="input-field text-sm resize-none" maxLength={500} />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-dark-100">
            <button type="button" onClick={onClose} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : isEdit ? "Update Driver" : "Add Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DriverForm;
