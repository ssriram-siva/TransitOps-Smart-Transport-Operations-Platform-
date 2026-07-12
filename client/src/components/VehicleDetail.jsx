import { X, Truck, Calendar, Fuel, Shield, MapPin, Clock, AlertTriangle } from "lucide-react";

const statusConfig = {
  available: { label: "Available", bg: "bg-secondary-50", text: "text-secondary-700", dot: "bg-secondary-500" },
  on_trip: { label: "On Trip", bg: "bg-primary-50", text: "text-primary-700", dot: "bg-primary-500" },
  in_shop: { label: "In Shop", bg: "bg-warning-50", text: "text-warning-700", dot: "bg-warning-500" },
  retired: { label: "Retired", bg: "bg-danger-50", text: "text-danger-700", dot: "bg-danger-500" },
};

const typeLabels = { truck: "Truck", bus: "Bus", van: "Van", trailer: "Trailer", tanker: "Tanker" };
const fuelLabels = { diesel: "Diesel", petrol: "Petrol", cng: "CNG", electric: "Electric", hybrid: "Hybrid" };
const unitLabels = { tons: "Tons", kg: "Kg", liters: "Liters", seats: "Seats", cubic_meters: "m³" };

function VehicleDetail({ isOpen, onClose, vehicle }) {
  if (!isOpen || !vehicle) return null;

  const status = statusConfig[vehicle.status];

  const isExpiringSoon = (date) => {
    if (!date) return false;
    const diff = new Date(date) - new Date();
    return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
  };

  const isExpired = (date) => {
    if (!date) return false;
    return new Date(date) < new Date();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-scale-in overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-dark-900 to-dark-800 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{vehicle.registrationNumber}</h2>
                <p className="text-white/50 text-sm">
                  {typeLabels[vehicle.type]} • {vehicle.make} {vehicle.model}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white/10 text-white`}>
              <span className={`w-2 h-2 rounded-full ${status.dot}`} />
              {status.label}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-400 mb-0.5">Type</p>
              <p className="text-sm font-semibold text-dark-800">{typeLabels[vehicle.type]}</p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-400 mb-0.5">Year</p>
              <p className="text-sm font-semibold text-dark-800">{vehicle.year}</p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-400 mb-0.5">Capacity</p>
              <p className="text-sm font-semibold text-dark-800">
                {vehicle.capacityValue} {unitLabels[vehicle.capacityUnit]}
              </p>
            </div>
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-400 mb-0.5">Fuel</p>
              <p className="text-sm font-semibold text-dark-800 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5 text-dark-400" />
                {fuelLabels[vehicle.fuelType]}
              </p>
            </div>
          </div>

          {/* Expiry Dates */}
          {(vehicle.insuranceExpiry || vehicle.fitnessExpiry) && (
            <div className="border border-dark-100 rounded-xl p-4">
              <h3 className="text-sm font-bold text-dark-700 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-dark-400" />
                Documents
              </h3>
              <div className="space-y-2">
                {vehicle.insuranceExpiry && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-500">Insurance Expiry</span>
                    <span className={`text-sm font-semibold flex items-center gap-1.5 ${
                      isExpired(vehicle.insuranceExpiry) ? "text-danger-600" :
                      isExpiringSoon(vehicle.insuranceExpiry) ? "text-warning-600" : "text-dark-700"
                    }`}>
                      {isExpired(vehicle.insuranceExpiry) && <AlertTriangle className="w-3.5 h-3.5" />}
                      {isExpiringSoon(vehicle.insuranceExpiry) && <Clock className="w-3.5 h-3.5" />}
                      {new Date(vehicle.insuranceExpiry).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                )}
                {vehicle.fitnessExpiry && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-dark-500">Fitness Expiry</span>
                    <span className={`text-sm font-semibold flex items-center gap-1.5 ${
                      isExpired(vehicle.fitnessExpiry) ? "text-danger-600" :
                      isExpiringSoon(vehicle.fitnessExpiry) ? "text-warning-600" : "text-dark-700"
                    }`}>
                      {isExpired(vehicle.fitnessExpiry) && <AlertTriangle className="w-3.5 h-3.5" />}
                      {isExpiringSoon(vehicle.fitnessExpiry) && <Clock className="w-3.5 h-3.5" />}
                      {new Date(vehicle.fitnessExpiry).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {vehicle.notes && (
            <div className="p-3 bg-dark-50 rounded-xl">
              <p className="text-xs text-dark-400 mb-0.5">Notes</p>
              <p className="text-sm text-dark-700">{vehicle.notes}</p>
            </div>
          )}
        </div>

        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full btn-secondary text-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default VehicleDetail;
