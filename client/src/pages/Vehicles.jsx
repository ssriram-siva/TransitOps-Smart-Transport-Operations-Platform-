import { useState, useEffect, useCallback } from "react";
import {
  Truck,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  Wrench,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import VehicleForm from "../components/VehicleForm";
import VehicleDetail from "../components/VehicleDetail";

const statusConfig = {
  available: { label: "Available", bg: "bg-secondary-50", text: "text-secondary-700", dot: "bg-secondary-500" },
  on_trip: { label: "On Trip", bg: "bg-primary-50", text: "text-primary-700", dot: "bg-primary-500" },
  in_shop: { label: "In Shop", bg: "bg-warning-50", text: "text-warning-700", dot: "bg-warning-500" },
  retired: { label: "Retired", bg: "bg-danger-50", text: "text-danger-700", dot: "bg-danger-500" },
};

const typeLabels = { truck: "Truck", bus: "Bus", van: "Van", trailer: "Trailer", tanker: "Tanker" };
const unitLabels = { tons: "Tons", kg: "Kg", liters: "Liters", seats: "Seats", cubic_meters: "m³" };

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [summary, setSummary] = useState({ total: 0, available: 0, on_trip: 0, in_shop: 0 });

  const [formOpen, setFormOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [detailVehicle, setDetailVehicle] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { api, isDispatcher } = useAuth();

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);

      const res = await api.get(`/vehicles?${params.toString()}`);
      setVehicles(res.data.vehicles);
      setSummary(res.data.summary);
    } catch (err) {
      toast.error("Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchVehicles(), 300);
    return () => clearTimeout(timer);
  }, [fetchVehicles]);

  const handleSave = async (data) => {
    if (editVehicle) {
      await api.put(`/vehicles/${editVehicle._id}`, data);
      toast.success("Vehicle updated successfully");
    } else {
      await api.post("/vehicles", data);
      toast.success("Vehicle added successfully");
    }
    fetchVehicles();
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/vehicles/${id}`);
      toast.success("Vehicle deleted successfully");
      setDeleteConfirm(null);
      fetchVehicles();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete vehicle");
    }
  };

  const handleAdd = () => {
    setEditVehicle(null);
    setFormOpen(true);
  };

  const handleEdit = (vehicle) => {
    setEditVehicle(vehicle);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-dark-900 tracking-tight">Vehicles</h1>
          <p className="text-dark-400 mt-1">Manage your fleet vehicles</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchVehicles} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {isDispatcher && (
            <button onClick={handleAdd} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Vehicles", value: summary.total, icon: Truck, color: "text-primary-600", bg: "bg-primary-50" },
          { label: "Available", value: summary.available, icon: CheckCircle2, color: "text-secondary-600", bg: "bg-secondary-50" },
          { label: "On Trip", value: summary.on_trip, icon: ArrowUpRight, color: "text-primary-600", bg: "bg-primary-50" },
          { label: "In Maintenance", value: summary.in_shop, icon: Wrench, color: "text-warning-600", bg: "bg-warning-50" },
        ].map((card) => (
          <div key={card.label} className="stat-card">
            <div className="flex items-center gap-3">
              <div className={`${card.bg} p-2.5 rounded-xl`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <div>
                <p className="text-xs text-dark-400">{card.label}</p>
                <p className="text-xl font-bold text-dark-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="p-4 border-b border-dark-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by registration, make, model..."
              className="input-field pl-10 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto text-sm"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="on_trip">On Trip</option>
            <option value="in_shop">In Shop</option>
            <option value="retired">Retired</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Registration</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Make / Model</th>
                <th className="text-left px-4 py-3">Capacity</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-primary-500 mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-dark-500">Loading vehicles...</p>
                  </td>
                </tr>
              ) : vehicles.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-12 text-center">
                    <img src="/empty-fleet.svg" alt="No vehicles" className="w-40 h-auto mx-auto mb-3 opacity-80" />
                    <p className="text-sm text-dark-500 font-medium">No vehicles found</p>
                    <p className="text-xs text-dark-400 mt-1">
                      {isDispatcher ? "Click 'Add Vehicle' to get started" : "No vehicles match your search"}
                    </p>
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => {
                  const status = statusConfig[vehicle.status];
                  return (
                    <tr key={vehicle._id} className="border-b border-dark-50 hover:bg-dark-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-dark-800">{vehicle.registrationNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-600">{typeLabels[vehicle.type]}</td>
                      <td className="px-4 py-3 text-sm text-dark-600">{vehicle.make} {vehicle.model}</td>
                      <td className="px-4 py-3 text-sm text-dark-600">{vehicle.capacityValue} {unitLabels[vehicle.capacityUnit]}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetailVehicle(vehicle)} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          {isDispatcher && (
                            <>
                              <button onClick={() => handleEdit(vehicle)} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400 hover:text-primary-600 transition-colors">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeleteConfirm(vehicle)} className="p-1.5 rounded-lg hover:bg-danger-50 text-dark-400 hover:text-danger-600 transition-colors">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!loading && vehicles.length > 0 && (
          <div className="px-4 py-3 border-t border-dark-100 flex items-center justify-between text-sm text-dark-500">
            <span>Showing {vehicles.length} vehicles</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <VehicleForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditVehicle(null); }}
        vehicle={editVehicle}
        onSave={handleSave}
      />

      <VehicleDetail
        isOpen={!!detailVehicle}
        onClose={() => setDetailVehicle(null)}
        vehicle={detailVehicle}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-danger-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-danger-600" />
              </div>
              <div>
                <h3 className="font-bold text-dark-900">Delete Vehicle</h3>
                <p className="text-xs text-dark-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-dark-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.registrationNumber}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm._id)} className="btn-danger text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Vehicles;
