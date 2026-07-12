import { useState, useEffect, useCallback } from "react";
import {
  MapPin,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Truck,
  ArrowRight,
  Play,
  Square,
  Loader2,
  RefreshCw,
  AlertCircle,
  Pencil,
  Radio,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import TripForm from "../components/TripForm";
import TripDetail from "../components/TripDetail";

const statusConfig = {
  scheduled: { label: "Scheduled", bg: "bg-dark-100", text: "text-dark-600", dot: "bg-dark-400" },
  dispatched: { label: "Dispatched", bg: "bg-primary-50", text: "text-primary-700", dot: "bg-primary-500" },
  in_progress: { label: "In Progress", bg: "bg-primary-50", text: "text-primary-700", dot: "bg-primary-500" },
  completed: { label: "Completed", bg: "bg-secondary-50", text: "text-secondary-700", dot: "bg-secondary-500" },
  cancelled: { label: "Cancelled", bg: "bg-danger-50", text: "text-danger-700", dot: "bg-danger-500" },
};

function Trips() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [summary, setSummary] = useState({ total: 0, scheduled: 0, dispatched: 0, in_progress: 0, completed: 0, cancelled: 0 });

  const [formOpen, setFormOpen] = useState(false);
  const [editTrip, setEditTrip] = useState(null);
  const [detailTrip, setDetailTrip] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { api, isDispatcher } = useAuth();
  const { connected, joinRoom, on, off } = useSocket();

  const fetchTrips = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);

      const res = await api.get(`/trips?${params.toString()}`);
      setTrips(res.data.trips);
      setSummary(res.data.summary);
    } catch (err) {
      toast.error("Failed to load trips");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchTrips(), 300);
    return () => clearTimeout(timer);
  }, [fetchTrips]);

  useEffect(() => {
    joinRoom("trips");
  }, []);

  useEffect(() => {
    const handleTripEvent = (data) => {
      fetchTrips();
      if (data.tripId) {
        toast(`Trip updated`, { icon: "🔄" });
      }
    };

    on("trip:created", handleTripEvent);
    on("trip:dispatched", (data) => {
      fetchTrips();
      toast.success(`${data.registrationNumber} dispatched: ${data.origin} → ${data.destination}`);
    });
    on("trip:completed", (data) => {
      fetchTrips();
      toast.success(`Trip completed: ${data.origin} → ${data.destination}`);
    });
    on("trip:cancelled", (data) => {
      fetchTrips();
      toast(`Trip cancelled: ${data.origin} → ${data.destination}`, { icon: "⚠️" });
    });

    return () => {
      off("trip:created", handleTripEvent);
      off("trip:dispatched");
      off("trip:completed");
      off("trip:cancelled");
    };
  }, [on, off, fetchTrips]);

  const handleSave = async (data) => {
    try {
      if (editTrip) {
        await api.put(`/trips/${editTrip._id}`, data);
        toast.success("Trip updated");
      } else {
        await api.post("/trips", data);
        toast.success("Trip scheduled");
      }
      fetchTrips();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save trip");
      throw err;
    }
  };

  const handleDispatch = async (trip) => {
    try {
      await api.put(`/trips/${trip._id}/dispatch`);
      toast.success("Trip dispatched");
      fetchTrips();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to dispatch trip");
    }
  };

  const handleComplete = async (trip) => {
    try {
      await api.put(`/trips/${trip._id}/complete`);
      toast.success("Trip completed");
      fetchTrips();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to complete trip");
    }
  };

  const handleCancel = async (trip) => {
    try {
      await api.put(`/trips/${trip._id}/cancel`);
      toast.success("Trip cancelled");
      fetchTrips();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to cancel trip");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/trips/${id}`);
      toast.success("Trip deleted");
      setDeleteConfirm(null);
      fetchTrips();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cannot delete active trip");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-dark-900 tracking-tight">Trips</h1>
          <p className="text-dark-400 mt-1">Dispatch, track, and manage all trips</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
              connected
                ? "bg-secondary-50 text-secondary-700"
                : "bg-danger-50 text-danger-700"
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${connected ? "animate-pulse" : ""}`} />
            {connected ? "Live" : "Offline"}
          </div>
          <button onClick={fetchTrips} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {isDispatcher && (
            <button onClick={() => { setEditTrip(null); setFormOpen(true); }} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              New Trip
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Trips", value: summary.total, icon: MapPin, color: "text-primary-600", bg: "bg-primary-50" },
          { label: "In Progress", value: summary.in_progress, icon: Play, color: "text-primary-600", bg: "bg-primary-50" },
          { label: "Completed", value: summary.completed, icon: CheckCircle2, color: "text-secondary-600", bg: "bg-secondary-50" },
          { label: "Cancelled", value: summary.cancelled, icon: XCircle, color: "text-danger-600", bg: "bg-danger-50" },
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
              placeholder="Search by route, vehicle, driver, cargo..."
              className="input-field pl-10 text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field w-auto text-sm"
          >
            <option value="all">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Route</th>
                <th className="text-left px-4 py-3">Vehicle</th>
                <th className="text-left px-4 py-3">Driver</th>
                <th className="text-left px-4 py-3">Cargo</th>
                <th className="text-left px-4 py-3">Departure</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-primary-500 mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-dark-500">Loading trips...</p>
                  </td>
                </tr>
              ) : trips.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-12 text-center">
                    <img src="/empty-trips.svg" alt="No trips" className="w-40 h-auto mx-auto mb-3 opacity-80" />
                    <p className="text-sm text-dark-500 font-medium">No trips found</p>
                  </td>
                </tr>
              ) : (
                trips.map((trip) => {
                  const status = statusConfig[trip.status] || statusConfig.scheduled;
                  return (
                    <tr key={trip._id} className="border-b border-dark-50 hover:bg-dark-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-dark-700 font-medium">{trip.origin}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-dark-300" />
                          <span className="text-dark-700 font-medium">{trip.destination}</span>
                        </div>
                        {trip.distance && (
                          <p className="text-xs text-dark-400">{trip.distance} km</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Truck className="w-3.5 h-3.5 text-dark-400" />
                          <span className="font-mono text-dark-600">{trip.vehicle?.registrationNumber}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                            {trip.driver?.name?.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="text-sm text-dark-600">{trip.driver?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-600 max-w-[160px] truncate">
                        {trip.cargoWeight} {trip.cargoUnit === "tons" ? "T" : "kg"}
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-500 whitespace-nowrap">
                        {new Date(trip.scheduledDeparture).toLocaleDateString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} ${(trip.status === "in_progress" || trip.status === "dispatched") ? "animate-pulse" : ""}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetailTrip(trip)} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          {isDispatcher && trip.status === "scheduled" && (
                            <>
                              <button onClick={() => { setEditTrip(trip); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400 hover:text-primary-600 transition-colors" title="Edit">
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDispatch(trip)} className="p-1.5 rounded-lg hover:bg-secondary-50 text-dark-400 hover:text-secondary-600 transition-colors" title="Dispatch">
                                <Play className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isDispatcher && trip.status === "in_progress" && (
                            <button onClick={() => handleComplete(trip)} className="p-1.5 rounded-lg hover:bg-secondary-50 text-dark-400 hover:text-secondary-600 transition-colors" title="Complete">
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          {isDispatcher && (trip.status === "scheduled" || trip.status === "in_progress") && (
                            <button onClick={() => handleCancel(trip)} className="p-1.5 rounded-lg hover:bg-danger-50 text-dark-400 hover:text-danger-600 transition-colors" title="Cancel">
                              <Square className="w-4 h-4" />
                            </button>
                          )}
                          {isDispatcher && (trip.status === "scheduled" || trip.status === "completed" || trip.status === "cancelled") && (
                            <button onClick={() => setDeleteConfirm(trip)} className="p-1.5 rounded-lg hover:bg-danger-50 text-dark-400 hover:text-danger-600 transition-colors" title="Delete">
                              <XCircle className="w-4 h-4" />
                            </button>
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

        {!loading && trips.length > 0 && (
          <div className="px-4 py-3 border-t border-dark-100 flex items-center justify-between text-sm text-dark-500">
            <span>Showing {trips.length} trips</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <TripForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditTrip(null); }}
        trip={editTrip}
        onSave={handleSave}
      />

      <TripDetail
        isOpen={!!detailTrip}
        onClose={() => setDetailTrip(null)}
        trip={detailTrip}
      />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-danger-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-danger-600" />
              </div>
              <div>
                <h3 className="font-bold text-dark-900">Delete Trip</h3>
                <p className="text-xs text-dark-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-dark-600 mb-6">
              Delete trip from <strong>{deleteConfirm.origin}</strong> to <strong>{deleteConfirm.destination}</strong>?
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

export default Trips;
