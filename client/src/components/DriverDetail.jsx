import { X, Users, Calendar, Phone, Mail, MapPin, Shield, AlertTriangle, Clock, CheckCircle2, Ban } from "lucide-react";

const statusConfig = {
  available: { label: "Available", bg: "bg-secondary-50", text: "text-secondary-700", dot: "bg-secondary-500", icon: CheckCircle2 },
  on_trip: { label: "On Trip", bg: "bg-primary-50", text: "text-primary-700", dot: "bg-primary-500", icon: Clock },
  suspended: { label: "Suspended", bg: "bg-danger-50", text: "text-danger-700", dot: "bg-danger-500", icon: Ban },
  off_duty: { label: "Off Duty", bg: "bg-dark-100", text: "text-dark-600", dot: "bg-dark-400", icon: Clock },
};

function DriverDetail({ isOpen, onClose, driver }) {
  if (!isOpen || !driver) return null;

  const status = statusConfig[driver.status];
  const StatusIcon = status.icon;

  const isExpired = (date) => date && new Date(date) < new Date();
  const isExpiringSoon = (date) => {
    if (!date) return false;
    const diff = new Date(date) - new Date();
    return diff > 0 && diff <= 90 * 24 * 60 * 60 * 1000;
  };

  const licenseExpired = isExpired(driver.licenseExpiry);
  const licenseExpiring = isExpiringSoon(driver.licenseExpiry);
  const canDispatch = driver.status !== "suspended" && driver.status !== "on_trip" && !licenseExpired;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in overflow-hidden">
        <div className="bg-gradient-to-r from-dark-900 to-dark-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-lg font-bold">
                {driver.name.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <h2 className="text-xl font-bold">{driver.name}</h2>
                <p className="text-white/50 text-sm">{driver.licenseNumber}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 text-white">
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            {licenseExpired && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-danger-500/20 text-red-300">
                <AlertTriangle className="w-3 h-3" />
                License Expired
              </span>
            )}
            {!licenseExpired && licenseExpiring && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-warning-500/20 text-yellow-300">
                <Clock className="w-3 h-3" />
                License Expiring Soon
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Dispatch Eligibility */}
          <div className={`p-3 rounded-xl border ${canDispatch ? "bg-secondary-50 border-secondary-200" : "bg-danger-50 border-danger-200"}`}>
            <div className="flex items-center gap-2">
              {canDispatch ? (
                <CheckCircle2 className="w-5 h-5 text-secondary-600" />
              ) : (
                <Ban className="w-5 h-5 text-danger-600" />
              )}
              <div>
                <p className={`text-sm font-semibold ${canDispatch ? "text-secondary-700" : "text-danger-700"}`}>
                  {canDispatch ? "Eligible for Dispatch" : "Cannot Dispatch"}
                </p>
                {!canDispatch && (
                  <p className="text-xs text-danger-600 mt-0.5">
                    {driver.status === "suspended" && "Driver is suspended. "}
                    {driver.status === "on_trip" && "Driver is currently on a trip. "}
                    {licenseExpired && "Driver's license has expired."}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-400 mb-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
              <p className="text-sm font-semibold text-dark-800">{driver.phone}</p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-400 mb-0.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
              <p className="text-sm font-semibold text-dark-800 truncate">{driver.email || "—"}</p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-400 mb-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> City</p>
              <p className="text-sm font-semibold text-dark-800">{driver.city || "—"}</p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-400 mb-0.5 flex items-center gap-1"><Shield className="w-3 h-3" /> License Class</p>
              <p className="text-sm font-semibold text-dark-800">{driver.licenseClass}</p>
            </div>
          </div>

          {/* License Expiry */}
          <div className="border border-dark-100 rounded-xl p-4">
            <h3 className="text-sm font-bold text-dark-700 mb-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-dark-400" />
              License Expiry
            </h3>
            <div className="flex items-center justify-between">
              <span className="text-sm text-dark-500">Expiry Date</span>
              <span className={`text-sm font-semibold flex items-center gap-1.5 ${licenseExpired ? "text-danger-600" : licenseExpiring ? "text-warning-600" : "text-dark-700"}`}>
                {licenseExpired && <AlertTriangle className="w-3.5 h-3.5" />}
                {!licenseExpired && licenseExpiring && <Clock className="w-3.5 h-3.5" />}
                {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString("en-IN") : "—"}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-dark-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-dark-900">{driver.totalTrips || 0}</p>
              <p className="text-xs text-dark-400">Total Trips</p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl text-center">
              <p className="text-2xl font-bold text-warning-600 flex items-center justify-center gap-1">
                ★ {driver.rating?.toFixed(1) || "0.0"}
              </p>
              <p className="text-xs text-dark-400">Rating</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full btn-secondary text-sm">Close</button>
        </div>
      </div>
    </div>
  );
}

export default DriverDetail;
