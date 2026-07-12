import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Truck,
  Users,
  MapPin,
  ArrowRight,
  Wrench,
  Fuel,
  DollarSign,
  RefreshCw,
  Radio,
  WifiOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

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
              {typeof entry.value === "number" && entry.value > 999
                ? `₹${(entry.value / 1000).toFixed(0)}K`
                : entry.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function Dashboard() {
  const [timeRange, setTimeRange] = useState("12m");
  const [stats, setStats] = useState(null);
  const [reports, setReports] = useState(null);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveUpdate, setLiveUpdate] = useState(false);

  const { api } = useAuth();
  const { connected, joinRoom, on, off } = useSocket();

  const fetchDashboard = useCallback(async () => {
    try {
      const [dashRes, reportsRes] = await Promise.all([
        api.get("/reports/dashboard"),
        api.get("/reports/fleet-utilization"),
      ]);
      setStats(dashRes.data.dashboard);
      setReports(reportsRes.data);
      setRecentTrips(dashRes.data.dashboard.recentTrips || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    joinRoom("dashboard");
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setLiveUpdate(true);
      fetchDashboard();
      setTimeout(() => setLiveUpdate(false), 1000);
    };

    on("dashboard:update", handleUpdate);
    return () => off("dashboard:update", handleUpdate);
  }, [on, off, fetchDashboard]);

  const summary = stats?.trips || {};
  const fleetSummary = stats?.vehicles || {};
  const costBreakdown = stats?.costs || {};
  const utilization = reports?.utilization || [];

  const driverSummary = stats?.drivers || {};

  const statCards = [
    {
      title: "Total Vehicles",
      value: fleetSummary.total || 0,
      icon: Truck,
      gradient: "from-blue-500 to-blue-600",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Drivers",
      value: driverSummary.available || 0,
      icon: Users,
      gradient: "from-emerald-500 to-emerald-600",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Active Trips",
      value: summary.in_progress || 0,
      icon: MapPin,
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      title: "Monthly Costs",
      value: `₹${((costBreakdown.totalOperating || 0) / 1000).toFixed(0)}K`,
      icon: DollarSign,
      gradient: "from-purple-500 to-purple-600",
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  const fleetStatus = [
    { name: "Available", value: fleetSummary.available || 0, color: COLORS.secondary },
    { name: "On Trip", value: fleetSummary.on_trip || 0, color: COLORS.primary },
    { name: "In Shop", value: fleetSummary.in_shop || 0, color: COLORS.warning },
    { name: "Retired", value: fleetSummary.retired || 0, color: COLORS.danger },
  ];

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-dark-200 rounded-xl" />
            <div className="h-4 w-72 bg-dark-100 rounded-lg" />
          </div>
          <div className="h-10 w-32 bg-dark-100 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card space-y-3">
              <div className="h-4 w-24 bg-dark-100 rounded" />
              <div className="h-8 w-16 bg-dark-200 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="h-6 w-40 bg-dark-100 rounded mb-6" />
            <div className="h-72 bg-dark-50 rounded-xl" />
          </div>
          <div className="card">
            <div className="h-6 w-32 bg-dark-100 rounded mb-6" />
            <div className="h-52 bg-dark-50 rounded-xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="h-6 w-32 bg-dark-100 rounded mb-5" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-dark-50 rounded-xl" />
              ))}
            </div>
          </div>
          <div className="card">
            <div className="h-6 w-32 bg-dark-100 rounded mb-5" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 bg-dark-50 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-dark-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-dark-400 mt-1">
            Overview of your fleet operations and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
              liveUpdate
                ? "bg-secondary-100 text-secondary-700 scale-105"
                : connected
                ? "bg-secondary-50 text-secondary-700"
                : "bg-danger-50 text-danger-700"
            }`}
          >
            {connected ? (
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            ) : (
              <WifiOff className="w-3.5 h-3.5" />
            )}
            {connected ? "Live" : "Offline"}
          </div>
          <div className="flex bg-dark-100 rounded-xl p-1">
            {["24h", "7d", "12m"].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  timeRange === range
                    ? "bg-white text-dark-900 shadow-sm"
                    : "text-dark-500 hover:text-dark-700"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <button
            onClick={fetchDashboard}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className="stat-card group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-dark-400">{stat.title}</p>
                <p className="text-3xl font-bold text-dark-900 tracking-tight">
                  {stat.value}
                </p>
              </div>
              <div
                className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Utilization Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-dark-900">Fleet Utilization</h2>
              <p className="text-sm text-dark-400 mt-0.5">Monthly trip and completion trends</p>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilization}>
                <defs>
                  <linearGradient id="tripsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.secondary} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={COLORS.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="trips" stroke={COLORS.primary} strokeWidth={2.5} fill="url(#tripsGrad)" name="Trips" />
                <Area type="monotone" dataKey="completed" stroke={COLORS.secondary} strokeWidth={2.5} fill="url(#completedGrad)" name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 text-xs mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-primary-500" />
              <span className="text-dark-500">Total Trips</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-secondary-500" />
              <span className="text-dark-500">Completed</span>
            </div>
          </div>
        </div>

        {/* Fleet Status Pie */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-dark-900">Fleet Status</h2>
              <p className="text-sm text-dark-400 mt-0.5">Current distribution</p>
            </div>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fleetStatus.filter((s) => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {fleetStatus
                    .filter((s) => s.value > 0)
                    .map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {fleetStatus.map((item) => (
              <div key={item.name} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-dark-50">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                  <p className="text-xs text-dark-500">{item.name}</p>
                  <p className="text-sm font-bold text-dark-800">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Trips */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-dark-900">Active Trips</h2>
            <a href="/trips" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              View All
            </a>
          </div>
          {recentTrips.length === 0 ? (
            <div className="p-8 text-center">
              <img src="/empty-trips.svg" alt="No active trips" className="w-32 h-auto mx-auto mb-3 opacity-80" />
              <p className="text-sm text-dark-400">No active trips</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <div
                  key={trip._id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-dark-50/80 hover:bg-dark-100 transition-colors"
                >
                <div className="w-9 h-9 rounded-lg bg-primary-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary-600" />
                </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="font-medium text-dark-800 truncate">{trip.origin}</span>
                      <ArrowRight className="w-3 h-3 text-dark-300 shrink-0" />
                      <span className="font-medium text-dark-800 truncate">{trip.destination}</span>
                    </div>
                    <p className="text-[11px] text-dark-400 mt-0.5">
                      {trip.vehicle?.registrationNumber} • {trip.driver?.name}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary-50 text-primary-700">
                    <span className="w-1 h-1 rounded-full bg-primary-500 animate-pulse" />
                    Live
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cost Breakdown */}
        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-dark-900">Monthly Costs</h2>
            <a href="/reports" className="text-xs font-semibold text-primary-600 hover:text-primary-700">
              View Reports
            </a>
          </div>
          <div className="space-y-4">
            {[
              { label: "Fuel", value: costBreakdown.fuel || 0, color: "bg-cyan-500", icon: Fuel },
              { label: "Maintenance", value: costBreakdown.maintenance || 0, color: "bg-warning-500", icon: Wrench },
              { label: "Expenses", value: costBreakdown.expenses || 0, color: "bg-purple-500", icon: DollarSign },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-sm font-medium text-dark-700">{item.label}</span>
                  </div>
                  <span className="text-sm font-bold text-dark-900">
                    ₹{item.value.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="w-full h-2 bg-dark-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.color} rounded-full transition-all duration-700`}
                    style={{
                      width: `${Math.min(
                        (item.value / Math.max(costBreakdown.totalOperating || 1, 1)) * 100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-dark-100 flex items-center justify-between">
              <span className="text-sm font-bold text-dark-900">Total</span>
              <span className="text-lg font-bold text-dark-900">
                ₹{(costBreakdown.totalOperating || 0).toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
