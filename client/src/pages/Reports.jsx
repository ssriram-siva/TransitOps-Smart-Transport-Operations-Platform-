import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  TrendingUp,
  TrendingDown,
  Truck,
  Users,
  MapPin,
  DollarSign,
  Fuel,
  Loader2,
  RefreshCw,
  Wrench,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const COLORS = {
  primary: "#3b82f6",
  secondary: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
};

const PIE_COLORS = [COLORS.secondary, COLORS.primary, COLORS.warning, COLORS.danger];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-white/70">{entry.name}:</span>
            <span className="font-medium">
              {typeof entry.value === "number" && entry.name !== "utilization" && entry.name !== "kmPerLiter" && entry.name !== "roiPercent"
                ? `₹${(entry.value / 1000).toFixed(1)}K`
                : entry.name === "utilization" || entry.name === "roiPercent"
                ? `${entry.value}%`
                : entry.name === "kmPerLiter"
                ? `${entry.value} km/L`
                : entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function Reports() {
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);
  const [utilization, setUtilization] = useState([]);
  const [fuelEfficiency, setFuelEfficiency] = useState([]);
  const [operationalCost, setOperationalCost] = useState([]);
  const [vehicleROI, setVehicleROI] = useState([]);
  const [exportOpen, setExportOpen] = useState(false);

  const { api } = useAuth();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, utilRes, fuelRes, costRes, roiRes] = await Promise.all([
        api.get("/reports/dashboard"),
        api.get("/reports/fleet-utilization?months=12"),
        api.get("/reports/fuel-efficiency"),
        api.get("/reports/operational-cost?months=12"),
        api.get("/reports/vehicle-roi"),
      ]);
      setDashboard(dashRes.data.dashboard);
      setUtilization(utilRes.data.utilization);
      setFuelEfficiency(fuelRes.data.efficiency);
      setOperationalCost(costRes.data.monthlyData);
      setVehicleROI(roiRes.data.roi);
    } catch (err) {
      toast.error("Failed to load reports data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleExport = async (type) => {
    try {
      const res = await api.get(`/reports/csv/${type}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${type}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(`${type} exported successfully`);
    } catch (err) {
      toast.error("Failed to export CSV");
    }
  };

  const formatCost = (cost) => {
    if (cost == null || cost === 0) return "₹0";
    if (cost >= 100000) return `₹${(cost / 100000).toFixed(1)}L`;
    if (cost >= 1000) return `₹${(cost / 1000).toFixed(1)}K`;
    return `₹${cost.toLocaleString("en-IN")}`;
  };

  const d = dashboard;

  const kpis = d
    ? [
        { label: "Fleet Utilization", value: `${d.vehicles.utilization}%`, icon: Truck, color: "text-primary-600", bg: "bg-primary-50" },
        { label: "Total Vehicles", value: d.vehicles.total, icon: Truck, color: "text-primary-600", bg: "bg-primary-50" },
        { label: "Active Drivers", value: d.drivers.available + d.drivers.on_trip, icon: Users, color: "text-secondary-600", bg: "bg-secondary-50" },
        { label: "Operating Cost", value: formatCost(d.costs.totalOperating), icon: DollarSign, color: "text-danger-600", bg: "bg-danger-50" },
        { label: "Avg Cost/Trip", value: formatCost(d.costs.avgCostPerTrip), icon: TrendingUp, color: "text-warning-600", bg: "bg-warning-50" },
        { label: "Completed Trips", value: d.trips.completed, icon: MapPin, color: "text-secondary-600", bg: "bg-secondary-50" },
      ]
    : [];

  const vehicleTypeDistribution = d
    ? (() => {
        const types = { truck: 0, bus: 0, van: 0, trailer: 0, tanker: 0 };
        // We count from vehicles API indirectly, use status for now
        return [
          { name: "Available", value: d.vehicles.available, color: COLORS.secondary },
          { name: "On Trip", value: d.vehicles.on_trip, color: COLORS.primary },
          { name: "In Shop", value: d.vehicles.in_shop, color: COLORS.warning },
          { name: "Retired", value: d.vehicles.retired, color: COLORS.danger },
        ];
      })()
    : [];

  const fuelEfficiencyChart = fuelEfficiency
    .filter((f) => f.kmPerLiter > 0)
    .slice(0, 8)
    .map((f) => ({
      vehicle: f.registrationNumber,
      kmPerLiter: f.kmPerLiter,
    }));

  const exportOptions = [
    { type: "vehicles", label: "Vehicles" },
    { type: "trips", label: "Trips" },
    { type: "fuel", label: "Fuel Logs" },
    { type: "expenses", label: "Expenses" },
    { type: "maintenance", label: "Maintenance" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-dark-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-dark-400 mt-1">Fleet performance, fuel efficiency, ROI, and operational costs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-dark-100 py-2 z-50 animate-scale-in">
                  {exportOptions.map((opt) => (
                    <button
                      key={opt.type}
                      onClick={() => { handleExport(opt.type); setExportOpen(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-dark-700 hover:bg-dark-50 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5 text-dark-400" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((kpi) => (
              <div key={kpi.label} className="stat-card">
                <div className={`${kpi.bg} w-9 h-9 rounded-xl flex items-center justify-center mb-3`}>
                  <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                </div>
                <p className="text-xs text-dark-400">{kpi.label}</p>
                <p className="text-xl font-bold text-dark-900 mt-0.5">{kpi.value}</p>
              </div>
            ))}
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue vs Expenses */}
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-bold text-dark-900">Revenue vs Expenses</h2>
                  <p className="text-sm text-dark-400 mt-0.5">Monthly comparison</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 rounded-full bg-secondary-500" />
                    <span className="text-dark-500">Revenue</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-1.5 rounded-full bg-danger-400" />
                    <span className="text-dark-500">Costs</span>
                  </div>
                </div>
              </div>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operationalCost} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill={COLORS.secondary} radius={[6, 6, 0, 0]} name="Revenue" />
                    <Bar dataKey="totalCost" fill={COLORS.danger} radius={[6, 6, 0, 0]} opacity={0.7} name="Costs" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fleet Status */}
            <div className="card">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-dark-900">Fleet Status</h2>
                <p className="text-sm text-dark-400 mt-0.5">Current vehicle distribution</p>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={vehicleTypeDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {vehicleTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {vehicleTypeDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 p-2 rounded-lg bg-dark-50">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div>
                      <p className="text-[11px] text-dark-400">{item.name}</p>
                      <p className="text-sm font-bold text-dark-800">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fleet Utilization Trend */}
            <div className="card">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-dark-900">Fleet Utilization Trend</h2>
                <p className="text-sm text-dark-400 mt-0.5">Monthly trips completed</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={utilization}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="trips" stroke={COLORS.primary} strokeWidth={2.5} dot={{ r: 4, fill: COLORS.primary, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} name="trips" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Fuel Efficiency */}
            <div className="card">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-dark-900">Fuel Efficiency</h2>
                <p className="text-sm text-dark-400 mt-0.5">Average km/liter by vehicle</p>
              </div>
              <div className="h-64">
                {fuelEfficiencyChart.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={fuelEfficiencyChart} layout="vertical" barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                      <YAxis dataKey="vehicle" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748b" }} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="kmPerLiter" fill={COLORS.cyan} radius={[0, 6, 6, 0]} name="kmPerLiter" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-sm text-dark-400">
                    No fuel data yet. Add fuel logs to see efficiency.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Vehicle ROI Table */}
          {vehicleROI.length > 0 && (
            <div className="card p-0 overflow-hidden">
              <div className="p-4 border-b border-dark-100">
                <h2 className="text-lg font-bold text-dark-900">Vehicle ROI</h2>
                <p className="text-sm text-dark-400 mt-0.5">Return on investment by vehicle</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="table-header">
                      <th className="text-left px-4 py-3">Vehicle</th>
                      <th className="text-right px-4 py-3">Trips</th>
                      <th className="text-right px-4 py-3">Revenue</th>
                      <th className="text-right px-4 py-3">Total Cost</th>
                      <th className="text-right px-4 py-3">Profit</th>
                      <th className="text-right px-4 py-3">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vehicleROI.map((v) => (
                      <tr key={v.vehicle._id} className="border-b border-dark-50 hover:bg-dark-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-mono font-semibold text-dark-800 text-sm">{v.vehicle.registrationNumber}</span>
                            <p className="text-xs text-dark-400">{v.vehicle.make} {v.vehicle.model}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-600 text-right">{v.trips}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-secondary-700 text-right">{formatCost(v.revenue)}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-dark-700 text-right">{formatCost(v.totalCost)}</td>
                        <td className={`px-4 py-3 text-sm font-bold text-right ${v.profit >= 0 ? "text-secondary-700" : "text-danger-700"}`}>
                          {formatCost(v.profit)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                            v.roiPercent >= 20 ? "bg-secondary-50 text-secondary-700" : v.roiPercent >= 0 ? "bg-warning-50 text-warning-700" : "bg-danger-50 text-danger-700"
                          }`}>
                            {v.roiPercent}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Reports;
