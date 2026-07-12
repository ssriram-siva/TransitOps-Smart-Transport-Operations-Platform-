import { X, Wrench, Truck, Calendar, DollarSign, User, Package } from "lucide-react";

const statusConfig = {
  scheduled: { label: "Scheduled", bg: "bg-primary-50", text: "text-primary-700", dot: "bg-primary-500" },
  in_progress: { label: "In Progress", bg: "bg-warning-50", text: "text-warning-700", dot: "bg-warning-500" },
  completed: { label: "Completed", bg: "bg-secondary-50", text: "text-secondary-700", dot: "bg-secondary-500" },
};

const typeConfig = {
  routine: { label: "Routine Service", color: "text-dark-600" },
  repair: { label: "Repair", color: "text-warning-600" },
  breakdown: { label: "Breakdown", color: "text-danger-600" },
  inspection: { label: "Inspection", color: "text-primary-600" },
};

function MaintenanceDetail({ isOpen, onClose, record }) {
  if (!isOpen || !record) return null;

  const status = statusConfig[record.status] || statusConfig.scheduled;
  const type = typeConfig[record.type] || typeConfig.routine;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto mx-4 animate-scale-in">
        <div className="flex items-center justify-between p-6 border-b border-dark-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning-50 rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-900">Maintenance Details</h2>
              <p className="text-xs text-dark-400">Record #{record._id?.slice(-6).toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 transition-colors">
            <X className="w-5 h-5 text-dark-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Vehicle */}
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-dark-100 rounded-xl flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-dark-500" />
            </div>
            <div>
              <p className="text-xs text-dark-400">Vehicle</p>
              <p className="text-sm font-semibold text-dark-800 font-mono">
                {record.vehicle?.registrationNumber || "—"}
              </p>
              {record.vehicle?.make && (
                <p className="text-xs text-dark-500">
                  {record.vehicle.make} {record.vehicle.model}
                </p>
              )}
            </div>
          </div>

          {/* Type + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-dark-100 rounded-xl flex items-center justify-center shrink-0">
                <Wrench className="w-4 h-4 text-dark-500" />
              </div>
              <div>
                <p className="text-xs text-dark-400">Type</p>
                <p className={`text-sm font-semibold ${type.color}`}>{type.label}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-dark-400 mb-1">Status</p>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-xs text-dark-400 mb-1">Description</p>
            <p className="text-sm text-dark-700">{record.description}</p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-dark-100 rounded-xl flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 text-dark-500" />
              </div>
              <div>
                <p className="text-xs text-dark-400">Scheduled</p>
                <p className="text-sm font-medium text-dark-700">
                  {record.scheduledDate
                    ? new Date(record.scheduledDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>
            {record.completedDate && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-secondary-50 rounded-xl flex items-center justify-center shrink-0">
                  <Calendar className="w-4 h-4 text-secondary-500" />
                </div>
                <div>
                  <p className="text-xs text-dark-400">Completed</p>
                  <p className="text-sm font-medium text-secondary-700">
                    {new Date(record.completedDate).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Shop + Technician */}
          <div className="grid grid-cols-2 gap-4">
            {record.shop && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-dark-100 rounded-xl flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-dark-500" />
                </div>
                <div>
                  <p className="text-xs text-dark-400">Shop</p>
                  <p className="text-sm font-medium text-dark-700">{record.shop}</p>
                </div>
              </div>
            )}
            {record.technician && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-dark-100 rounded-xl flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-dark-500" />
                </div>
                <div>
                  <p className="text-xs text-dark-400">Technician</p>
                  <p className="text-sm font-medium text-dark-700">{record.technician}</p>
                </div>
              </div>
            )}
          </div>

          {/* Cost */}
          {record.cost != null && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-dark-100 rounded-xl flex items-center justify-center shrink-0">
                <DollarSign className="w-4 h-4 text-dark-500" />
              </div>
              <div>
                <p className="text-xs text-dark-400">Cost</p>
                <p className="text-sm font-bold text-dark-800">
                  ₹{record.cost.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          )}

          {/* Parts Replaced */}
          {record.partsReplaced && record.partsReplaced.length > 0 && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-dark-100 rounded-xl flex items-center justify-center shrink-0">
                <Package className="w-4 h-4 text-dark-500" />
              </div>
              <div>
                <p className="text-xs text-dark-400 mb-1">Parts Replaced</p>
                <div className="flex flex-wrap gap-1.5">
                  {record.partsReplaced.map((part, i) => (
                    <span key={i} className="px-2 py-0.5 bg-dark-100 rounded-md text-xs font-medium text-dark-600">
                      {part}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {record.notes && (
            <div>
              <p className="text-xs text-dark-400 mb-1">Notes</p>
              <p className="text-sm text-dark-600 bg-dark-50 rounded-xl p-3">{record.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MaintenanceDetail;
