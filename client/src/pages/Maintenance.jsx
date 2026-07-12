import { useState, useEffect, useCallback } from "react";
import {
  Wrench,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  Truck,
  Calendar,
  DollarSign,
  Clock,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import MaintenanceForm from "../components/MaintenanceForm";
import MaintenanceDetail from "../components/MaintenanceDetail";

const statusConfig = {
  scheduled: { label: "Scheduled", bg: "bg-primary-50", text: "text-primary-700", dot: "bg-primary-500" },
  in_progress: { label: "In Progress", bg: "bg-warning-50", text: "text-warning-700", dot: "bg-warning-500" },
  completed: { label: "Completed", bg: "bg-secondary-50", text: "text-secondary-700", dot: "bg-secondary-500" },
};

const typeConfig = {
  routine: { label: "Routine", color: "text-dark-600" },
  repair: { label: "Repair", color: "text-warning-600" },
  breakdown: { label: "Breakdown", color: "text-danger-600" },
  inspection: { label: "Inspection", color: "text-primary-600" },
};

function Maintenance() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [summary, setSummary] = useState({ total: 0, scheduled: 0, in_progress: 0, completed: 0, totalCost: 0, monthCost: 0 });

  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [detailRecord, setDetailRecord] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { api, isDispatcher } = useAuth();

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (search) params.append("search", search);

      const res = await api.get(`/maintenance?${params.toString()}`);
      setRecords(res.data.records);
      setSummary(res.data.summary);
    } catch (err) {
      toast.error("Failed to load maintenance records");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => fetchRecords(), 300);
    return () => clearTimeout(timer);
  }, [fetchRecords]);

  const handleSave = async (data) => {
    try {
      if (editRecord) {
        await api.put(`/maintenance/${editRecord._id}`, data);
        toast.success("Maintenance record updated");
      } else {
        await api.post("/maintenance", data);
        toast.success("Maintenance scheduled");
      }
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save record");
      throw err;
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/maintenance/${id}`);
      toast.success("Maintenance record deleted");
      setDeleteConfirm(null);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete record");
    }
  };

  const formatCost = (cost) => {
    if (cost == null) return "—";
    if (cost >= 100000) return `₹${(cost / 100000).toFixed(1)}L`;
    if (cost >= 1000) return `₹${(cost / 1000).toFixed(1)}K`;
    return `₹${cost.toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-dark-900 tracking-tight">Maintenance</h1>
          <p className="text-dark-400 mt-1">Track vehicle maintenance, repairs, and inspections</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchRecords} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          {isDispatcher && (
            <button onClick={() => { setEditRecord(null); setFormOpen(true); }} className="btn-primary flex items-center gap-2 text-sm">
              <Plus className="w-4 h-4" />
              Schedule Maintenance
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Records", value: summary.total, icon: Wrench, color: "text-primary-600", bg: "bg-primary-50" },
          { label: "In Progress", value: summary.in_progress, icon: Clock, color: "text-warning-600", bg: "bg-warning-50" },
          { label: "Scheduled", value: summary.scheduled, icon: Calendar, color: "text-primary-600", bg: "bg-primary-50" },
          { label: "Total Cost", value: formatCost(summary.totalCost), icon: DollarSign, color: "text-secondary-600", bg: "bg-secondary-50" },
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
              placeholder="Search by description, shop..."
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
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input-field w-auto text-sm"
          >
            <option value="all">All Types</option>
            <option value="routine">Routine</option>
            <option value="repair">Repair</option>
            <option value="breakdown">Breakdown</option>
            <option value="inspection">Inspection</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="text-left px-4 py-3">Vehicle</th>
                <th className="text-left px-4 py-3">Type</th>
                <th className="text-left px-4 py-3">Description</th>
                <th className="text-left px-4 py-3">Shop</th>
                <th className="text-left px-4 py-3">Scheduled</th>
                <th className="text-left px-4 py-3">Cost</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-primary-500 mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-dark-500">Loading maintenance records...</p>
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <img src="/empty-data.svg" alt="No maintenance" className="w-40 h-auto mx-auto mb-3 opacity-80" />
                    <p className="text-sm text-dark-500 font-medium">No maintenance records found</p>
                    <p className="text-xs text-dark-400 mt-1">
                      {isDispatcher ? "Click 'Schedule Maintenance' to get started" : "No records match your search"}
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const status = statusConfig[record.status] || statusConfig.scheduled;
                  const type = typeConfig[record.type] || typeConfig.routine;
                  return (
                    <tr key={record._id} className="border-b border-dark-50 hover:bg-dark-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-dark-400" />
                          <span className="font-mono font-semibold text-dark-800 text-sm">
                            {record.vehicle?.registrationNumber || "—"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-medium ${type.color}`}>{type.label}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-dark-600 max-w-[220px] truncate">{record.description}</td>
                      <td className="px-4 py-3 text-sm text-dark-500">{record.shop || "—"}</td>
                      <td className="px-4 py-3 text-sm text-dark-500 whitespace-nowrap">
                        {record.scheduledDate
                          ? new Date(record.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-dark-700">{formatCost(record.cost)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${status.bg} ${status.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setDetailRecord(record)} className="p-1.5 rounded-lg hover:bg-dark-100 text-dark-400 hover:text-dark-600 transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                          {isDispatcher && (
                            <>
                              <button onClick={() => { setEditRecord(record); setFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400 hover:text-primary-600 transition-colors">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button onClick={() => setDeleteConfirm(record)} className="p-1.5 rounded-lg hover:bg-danger-50 text-dark-400 hover:text-danger-600 transition-colors">
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

        {!loading && records.length > 0 && (
          <div className="px-4 py-3 border-t border-dark-100 flex items-center justify-between text-sm text-dark-500">
            <span>Showing {records.length} records</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <MaintenanceForm
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditRecord(null); }}
        record={editRecord}
        onSave={handleSave}
      />

      <MaintenanceDetail
        isOpen={!!detailRecord}
        onClose={() => setDetailRecord(null)}
        record={detailRecord}
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
                <h3 className="font-bold text-dark-900">Delete Record</h3>
                <p className="text-xs text-dark-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-dark-600 mb-6">
              Are you sure you want to delete this maintenance record?
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

export default Maintenance;
