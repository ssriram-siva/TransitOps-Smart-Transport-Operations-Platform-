import { X, MapPin, ArrowRight, Truck, Users, Calendar, Package, Clock, DollarSign, FileText } from "lucide-react";

const statusConfig = {
  scheduled: { label: "Scheduled", bg: "bg-dark-100", text: "text-dark-600", dot: "bg-dark-400" },
  dispatched: { label: "Dispatched", bg: "bg-primary-50", text: "text-primary-700", dot: "bg-primary-500" },
  in_progress: { label: "In Progress", bg: "bg-primary-50", text: "text-primary-700", dot: "bg-primary-500" },
  completed: { label: "Completed", bg: "bg-secondary-50", text: "text-secondary-700", dot: "bg-secondary-500" },
  cancelled: { label: "Cancelled", bg: "bg-danger-50", text: "text-danger-700", dot: "bg-danger-500" },
};

const unitLabels = { tons: "Tons", kg: "Kg" };

function TripDetail({ isOpen, onClose, trip }) {
  if (!isOpen || !trip) return null;

  const status = statusConfig[trip.status] || statusConfig.scheduled;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto mx-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-dark-900">Trip Details</h2>
              <p className="text-xs text-dark-400 font-mono">{trip._id?.slice(-8)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
              {status.label}
            </span>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-100 transition-colors">
              <X className="w-5 h-5 text-dark-400" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Route */}
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-4">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-xs text-dark-400 mb-1">From</p>
                <p className="text-lg font-bold text-dark-900">{trip.origin}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-0.5 bg-dark-300" />
                <ArrowRight className="w-5 h-5 text-primary-600" />
                <div className="w-8 h-0.5 bg-dark-300" />
              </div>
              <div className="text-center">
                <p className="text-xs text-dark-400 mb-1">To</p>
                <p className="text-lg font-bold text-dark-900">{trip.destination}</p>
              </div>
            </div>
            {trip.distance && (
              <p className="text-center text-xs text-dark-500 mt-2">{trip.distance} km</p>
            )}
          </div>

          {/* Vehicle + Driver */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Vehicle</span>
              </div>
              <p className="font-mono font-semibold text-dark-800">{trip.vehicle?.registrationNumber}</p>
              <p className="text-xs text-dark-500 mt-0.5">
                {trip.vehicle?.make} {trip.vehicle?.model}
              </p>
              <p className="text-xs text-dark-400">
                {trip.vehicle?.capacityValue} {unitLabels[trip.vehicle?.capacityUnit] || trip.vehicle?.capacityUnit}
              </p>
            </div>
            <div className="bg-dark-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-secondary-600" />
                <span className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Driver</span>
              </div>
              <p className="font-semibold text-dark-800">{trip.driver?.name}</p>
              <p className="text-xs text-dark-500 mt-0.5">{trip.driver?.phone}</p>
              <p className="text-xs text-dark-400 font-mono">{trip.driver?.licenseNumber}</p>
            </div>
          </div>

          {/* Cargo */}
          <div className="bg-dark-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-warning-600" />
              <span className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Cargo</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-dark-400">Weight</p>
                <p className="font-semibold text-dark-800">
                  {trip.cargoWeight} {unitLabels[trip.cargoUnit] || trip.cargoUnit}
                </p>
              </div>
              <div>
                <p className="text-xs text-dark-400">Description</p>
                <p className="text-sm text-dark-700">{trip.cargoDescription || "—"}</p>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dark-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-primary-600" />
                <span className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Schedule</span>
              </div>
              <div>
                <p className="text-xs text-dark-400">Planned Departure</p>
                <p className="text-sm font-semibold text-dark-800">
                  {new Date(trip.scheduledDeparture).toLocaleString()}
                </p>
              </div>
              {trip.actualDeparture && (
                <div className="mt-2">
                  <p className="text-xs text-dark-400">Actual Departure</p>
                  <p className="text-sm text-dark-700">
                    {new Date(trip.actualDeparture).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="bg-dark-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-secondary-600" />
                <span className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Times</span>
              </div>
              {trip.arrival ? (
                <div>
                  <p className="text-xs text-dark-400">Arrival</p>
                  <p className="text-sm font-semibold text-dark-800">
                    {new Date(trip.arrival).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-dark-400">Not arrived</p>
              )}
              {trip.status === "in_progress" && trip.actualDeparture && (
                <div className="mt-2">
                  <p className="text-xs text-dark-400">Duration</p>
                  <p className="text-sm text-dark-700">
                    {Math.round((Date.now() - new Date(trip.actualDeparture).getTime()) / 60000)} min
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Cost + Notes */}
          {(trip.tripCost || trip.notes) && (
            <div className="grid grid-cols-2 gap-4">
              {trip.tripCost && (
                <div className="bg-dark-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-secondary-600" />
                    <span className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Cost</span>
                  </div>
                  <p className="text-lg font-bold text-dark-800">₹{trip.tripCost.toLocaleString()}</p>
                </div>
              )}
              {trip.notes && (
                <div className="bg-dark-50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-dark-400" />
                    <span className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Notes</span>
                  </div>
                  <p className="text-sm text-dark-600">{trip.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TripDetail;
