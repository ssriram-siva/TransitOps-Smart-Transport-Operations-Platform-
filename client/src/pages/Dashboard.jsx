import { useState } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Truck,
  Users,
  MapPin,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Fuel,
  DollarSign,
  Calendar,
  Filter,
  MoreHorizontal,
  RefreshCw,
  Download,
  Activity,
} from "lucide-react";

const COLORS = {
  primary: "#3b82f6",
  secondary: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  purple: "#8b5cf6",
  cyan: "#06b6d4",
  pink: "#ec4899",
};

const PIE_COLORS = [
  COLORS.secondary,
  COLORS.primary,
  COLORS.warning,
  COLORS.danger,
];

const monthlyTrips = [
  { month: "Jan", trips: 120, revenue: 48000 },
  { month: "Feb", trips: 135, revenue: 54000 },
  { month: "Mar", trips: 148, revenue: 59200 },
  { month: "Apr", trips: 142, revenue: 56800 },
  { month: "May", trips: 165, revenue: 66000 },
  { month: "Jun", trips: 178, revenue: 71200 },
  { month: "Jul", trips: 156, revenue: 62400 },
  { month: "Aug", trips: 189, revenue: 75600 },
  { month: "Sep", trips: 201, revenue: 80400 },
  { month: "Oct", trips: 195, revenue: 78000 },
  { month: "Nov", trips: 210, revenue: 84000 },
  { month: "Dec", trips: 225, revenue: 90000 },
];

const fuelData = [
  { week: "W1", diesel: 2400, petrol: 800 },
  { week: "W2", diesel: 2800, petrol: 950 },
  { week: "W3", diesel: 2200, petrol: 700 },
  { week: "W4", diesel: 3100, petrol: 1100 },
  { week: "W5", diesel: 2600, petrol: 850 },
  { week: "W6", diesel: 2900, petrol: 980 },
  { week: "W7", diesel: 2100, petrol: 750 },
  { week: "W8", diesel: 3000, petrol: 1050 },
];

const fleetStatus = [
  { name: "Available", value: 16, color: COLORS.secondary },
  { name: "On Trip", value: 5, color: COLORS.primary },
  { name: "In Shop", value: 2, color: COLORS.warning },
  { name: "Retired", value: 1, color: COLORS.danger },
];

const recentActivity = [
  {
    id: 1,
    icon: Truck,
    color: "bg-primary-500",
    title: "Vehicle dispatched",
    description: "MH-12-AB-1234 dispatched to Mumbai route",
    time: "2 min ago",
    type: "dispatch",
  },
  {
    id: 2,
    icon: CheckCircle2,
    color: "bg-secondary-500",
    title: "Trip completed",
    description: "Driver Rajesh completed trip #156",
    time: "15 min ago",
    type: "complete",
  },
  {
    id: 3,
    icon: Wrench,
    color: "bg-warning-500",
    title: "Maintenance scheduled",
    description: "KA-01-CD-5678 sent for scheduled maintenance",
    time: "1 hour ago",
    type: "maintenance",
  },
  {
    id: 4,
    icon: Users,
    color: "bg-purple-500",
    title: "New driver onboarded",
    description: "Amit Singh added to Delhi fleet",
    time: "2 hours ago",
    type: "driver",
  },
  {
    id: 5,
    icon: Fuel,
    color: "bg-cyan-500",
    title: "Fuel refilled",
    description: "DL-01-AB-1234 refueled - 85L diesel",
    time: "3 hours ago",
    type: "fuel",
  },
  {
    id: 6,
    icon: AlertTriangle,
    color: "bg-danger-500",
    title: "License expiring",
    description: "Driver Suresh Patel license expires in 15 days",
    time: "5 hours ago",
    type: "alert",
  },
];

const topPerformers = [
  { name: "Rajesh Kumar", trips: 42, rating: 4.9, efficiency: "96%" },
  { name: "Amit Singh", trips: 38, rating: 4.8, efficiency: "94%" },
  { name: "Priya Patel", trips: 35, rating: 4.7, efficiency: "92%" },
  { name: "Vikram Rao", trips: 31, rating: 4.6, efficiency: "90%" },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-dark-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
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

  const stats = [
    {
      title: "Total Vehicles",
      value: "24",
      change: "+2",
      changeLabel: "this month",
      trend: "up",
      icon: Truck,
      gradient: "from-blue-500 to-blue-600",
      shadow: "shadow-blue-500/20",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      title: "Active Drivers",
      value: "18",
      change: "+1",
      changeLabel: "this month",
      trend: "up",
      icon: Users,
      gradient: "from-emerald-500 to-emerald-600",
      shadow: "shadow-emerald-500/20",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      title: "Completed Trips",
      value: "1,286",
      change: "+12.5%",
      changeLabel: "from last month",
      trend: "up",
      icon: MapPin,
      gradient: "from-amber-500 to-orange-500",
      shadow: "shadow-amber-500/20",
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
    },
    {
      title: "Revenue",
      value: "₹9.4L",
      change: "+8.2%",
      changeLabel: "from last month",
      trend: "up",
      icon: DollarSign,
      gradient: "from-purple-500 to-purple-600",
      shadow: "shadow-purple-500/20",
      bg: "bg-purple-50",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
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
          <button className="btn-secondary flex items-center gap-2 text-sm">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <div
            key={stat.title}
            className="stat-card group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="space-y-3">
                <p className="text-sm font-medium text-dark-400">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-dark-900 tracking-tight">
                  {stat.value}
                </p>
                <div className="flex items-center gap-1.5">
                  {stat.trend === "up" ? (
                    <ArrowUpRight className="w-4 h-4 text-secondary-500" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-danger-500" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      stat.trend === "up" ? "text-secondary-600" : "text-danger-600"
                    }`}
                  >
                    {stat.change}
                  </span>
                  <span className="text-xs text-dark-400">
                    {stat.changeLabel}
                  </span>
                </div>
              </div>
              <div
                className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
              >
                <stat.icon className={`w-6 h-6 ${stat.iconColor}`} />
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-dark-100">
              <div className="flex items-center justify-between text-xs text-dark-400">
                <span>vs previous period</span>
                <Activity className="w-3 h-3" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Trips Chart */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-dark-900">
                Revenue & Trips
              </h2>
              <p className="text-sm text-dark-400 mt-0.5">
                Monthly performance overview
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full bg-primary-500" />
                <span className="text-dark-500">Trips</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-1.5 rounded-full bg-secondary-500" />
                <span className="text-dark-500">Revenue</span>
              </div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrips}>
                <defs>
                  <linearGradient id="tripsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primary} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={COLORS.primary} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.secondary} stopOpacity={0.15} />
                    <stop offset="100%" stopColor={COLORS.secondary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="trips"
                  stroke={COLORS.primary}
                  strokeWidth={2.5}
                  fill="url(#tripsGradient)"
                  name="Trips"
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke={COLORS.secondary}
                  strokeWidth={2.5}
                  fill="url(#revenueGradient)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fleet Status Pie */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-dark-900">Fleet Status</h2>
              <p className="text-sm text-dark-400 mt-0.5">
                Current vehicle distribution
              </p>
            </div>
            <button className="p-2 rounded-xl hover:bg-dark-100 transition-colors">
              <MoreHorizontal className="w-4 h-4 text-dark-400" />
            </button>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={fleetStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {fleetStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      stroke="none"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {fleetStatus.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-dark-50"
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <p className="text-xs text-dark-500">{item.name}</p>
                  <p className="text-sm font-bold text-dark-800">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fuel Consumption */}
        <div className="lg:col-span-1 card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-dark-900">
                Fuel Consumption
              </h2>
              <p className="text-sm text-dark-400 mt-0.5">
                Weekly fuel usage (liters)
              </p>
            </div>
            <button className="p-2 rounded-xl hover:bg-dark-100 transition-colors">
              <RefreshCw className="w-4 h-4 text-dark-400" />
            </button>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelData} barGap={2}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e2e8f0"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="diesel"
                  fill={COLORS.primary}
                  radius={[6, 6, 0, 0]}
                  name="Diesel"
                />
                <Bar
                  dataKey="petrol"
                  fill={COLORS.cyan}
                  radius={[6, 6, 0, 0]}
                  name="Petrol"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 text-xs mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-primary-500" />
              <span className="text-dark-500">Diesel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 rounded-full bg-cyan-500" />
              <span className="text-dark-500">Petrol</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-1 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-dark-900">
              Recent Activity
            </h2>
            <button className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-1">
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-dark-50 transition-colors group cursor-pointer"
              >
                <div
                  className={`${activity.color} w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform`}
                >
                  <activity.icon className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-800 truncate">
                    {activity.title}
                  </p>
                  <p className="text-xs text-dark-400 truncate mt-0.5">
                    {activity.description}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-dark-400 shrink-0">
                  <Clock className="w-3 h-3" />
                  <span className="text-[11px]">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Drivers */}
        <div className="lg:col-span-1 card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-dark-900">Top Drivers</h2>
            <button className="text-xs font-semibold text-primary-600 hover:text-primary-700 transition-colors">
              View All
            </button>
          </div>
          <div className="space-y-3">
            {topPerformers.map((driver, index) => (
              <div
                key={driver.name}
                className="flex items-center gap-3 p-3 rounded-xl bg-dark-50/80 hover:bg-dark-100 transition-colors"
              >
                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-primary-500/20">
                    {driver.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </div>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-warning-400 rounded-full flex items-center justify-center text-[8px] font-bold text-white shadow">
                      1
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-dark-800 truncate">
                    {driver.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] text-dark-400">
                      {driver.trips} trips
                    </span>
                    <span className="text-[11px] text-dark-400 flex items-center gap-0.5">
                      <span className="text-warning-500">★</span>{" "}
                      {driver.rating}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-secondary-600">
                    {driver.efficiency}
                  </p>
                  <p className="text-[10px] text-dark-400">efficiency</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
