import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import DriverForm from "../components/DriverForm";
import DriverDetail from "../components/DriverDetail";

const statusConfig = {
  available: { label: "Available", bg: "bg-secondary-50", text: "text-secondary-700", dot: "bg-secondary-500" },
  on_trip: { label: "On Trip", bg: "bg-primary-50", text: "text-primary-700", dot: "bg-primary-500" },
  suspended: { label: "Suspended", bg: "bg-danger-50", text: "text-danger-700", dot: "bg-danger-500" },
  off_duty: { label: "Off Duty", bg: "bg-dark-100", text: "text-dark-600", dot: "bg-dark-400" },
};

function Drivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [summary, setSummary] = useState({ total: 0, available: 0, on_trip: 0, suspended: 0, off_duty: 0, licenseExpiring: 0, licenseExpired: 0 });

  const [formOpen, setFormOpen] = useState(false);
  const [editDriver, setEditDriver] = useState(null);
  const [detailDriver, setDetailDriver] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { api, isDispatcher } = useAuth();

  const fetchDrivers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (search) params.append("search", search);
      const res = await api.get(`/drivers?${params.toString()}`);
      setDrivers(res.data.drivers);
      setSummary(res.data.summary);
    } catch (err) {
      toast.error("Failed to load drivers");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchDrivers(), 300);
    return () => clearTimeout(timer);
  }, [fetchDrivers]);

  const handleSave = async (data) => {
    if (editDriver) {
      await api.put(`/drivers/${editDriver._id}`, data);
      toast.success("Driver updated successfully");
    } else {
      await api.post("/drivers", data);
      toast.success("Driver added successfully");
    }
    fetchDrivers();
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/drivers/${id}`);
      toast.success("Driver deleted successfully");
      setDeleteConfirm(null);
      fetchDrivers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete driver");
    }
  };

  const isLicenseExpired = (date) => date && new Date(date) < new Date();
  const isLicenseExpiringSoon = (date) => {
    if (!date) return false;
    const diff = new Date(date) - new Date();
    return diff > 0 && diff <= 90 * 24 * 60 * 60 * 1000;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-dark-900 tracking-tight">Drivers</h1>
          <p className="text-dark-400 mt-1">Manage your fleet drivers and licenses</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchDrivers} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {isDispatcher && (
            <button onClick={() => { setEditDriver(null); setFormOpen(true); }} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Add Driver
            </button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Drivers", value: summary.total, icon: Users, color: "text-primary-600", bg: "bg-primary-50" },
          { label: "Available", value: summary.available, icon: CheckCircle2, color: "text-secondary-600", bg: "bg-secondary-50" },
          { label: "On Trip", value: summary.on_trip, icon: Clock, color: "text-primary-600", bg: "bg-primary-50" },
          { label: "License Expiring", value: summary.licenseExpiring, icon: AlertTriangle, color: "text-warning-600", bg: "bg-warning-50" },
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
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, license, phone..." className="input-field pl-10 text-sm" />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input-field w-auto text-sm">
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="on_trip">On Trip</option>
            <option value="off_duty">Off Duty</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Driver</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">License</th>
                <th className="text-left px-4 py-3">Expiry</th>
                <th className="text-left px-4 py-3">Trips</th>
                <th className="text-left px-4 py-3">Rating</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-primary-500 mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-dark-500">Loading drivers...</p>
                  </td>
                </tr>
              ) : drivers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <img src="/empty-data.svg" alt="No drivers" className="w-40 h-auto mx-auto mb-3 opacity-80" />
                    <p className="text-sm text-dark-500 font-medium">No drivers found</p>
                    <p className="text-xs text-dark-400 mt-1">{isDispatcher ? "Click 'Add Driver' to get started" : "No drivers match your search"}</p>
                  </td>
                </tr>
              ) : (
                drivers.map((driver) => {
                  const status = statusConfig[driver.status];
                  const expired = isLicenseExpired(driver.licenseExpiry);
                  const expiring = isLicenseExpiringSoon(driver.licenseExpiry);
                  return (
                    <tr key={driver._id} className="border-b border-dark-50 hover:bg-dark-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {driver.name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <span className="font-semibold text-dark-800 text-sm">{driver.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-600">{driver.phone}</td>
                      <td className="px-4 py-3 text-sm text-dark-600 font-mono">{driver.licenseNumber}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-sm ${expired ? "text-danger-600 font-semibold" : expiring ? "text-warning-600 font-semibold" : "text-dark-600"}`}>
                            {driver.licenseExpiry ? new Date(driver.licenseExpiry).toLocaleDateString("en-IN") : "—"}
                          </span>
                          {expired && <XCircle className="w-3.5 h-3.5 text-danger-500" />}
                          {!expired && expiring && <AlertTriangle className="w-3.5 h-3.5 text-warning-500" />}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-600 font-semibold">{driver.totalTrips || 0}</td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-semibold text-warning-600 flex items-center gap-1">
                          ★ {driver.rating?.toFixed(1) || "0.0"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetailDriver(driver)} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          {isDispatcher && (
                            <>
                              <button onClick={() => { setEditDriver(driver); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400 hover:text-primary-600 transition-colors">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeleteConfirm(driver)} className="p-1.5 rounded-lg hover:bg-danger-50 text-dark-400 hover:text-danger-600 transition-colors">
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

        {!loading && drivers.length > 0 && (
          <div className="px-4 py-3 border-t border-dark-100 text-sm text-dark-500">
            Showing {drivers.length} drivers
          </div>
        )}
      </div>

      {/* Modals */}
      <DriverForm isOpen={formOpen} onClose={() => { setFormOpen(false); setEditDriver(null); }} driver={editDriver} onSave={handleSave} />
      <DriverDetail isOpen={!!detailDriver} onClose={() => setDetailDriver(null)} driver={detailDriver} />

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm mx-4 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-danger-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-danger-600" />
              </div>
              <div>
                <h3 className="font-bold text-dark-900">Delete Driver</h3>
                <p className="text-xs text-dark-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-dark-600 mb-6">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>?
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

export default Drivers;
