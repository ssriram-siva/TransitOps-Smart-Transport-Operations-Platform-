import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Wrench,
  Fuel,
  BarChart3,
  Radio,
  Menu,
  X,
  Bell,
  ChevronDown,
  LogOut,
  Settings,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/vehicles", label: "Vehicles", icon: Truck },
  { path: "/drivers", label: "Drivers", icon: Users },
  { path: "/trips", label: "Trips", icon: MapPin },
  { path: "/tracking", label: "Live Tracking", icon: Radio },
  { path: "/maintenance", label: "Maintenance", icon: Wrench },
  { path: "/fuel", label: "Fuel & Expenses", icon: Fuel },
  { path: "/reports", label: "Reports", icon: BarChart3 },
];

const bottomNavItems = [
  { path: "/settings", label: "Settings", icon: Settings },
];

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const currentPage = navItems.find((i) => i.path === location.pathname);

  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "U";

  const roleLabels = {
    admin: "Administrator",
    dispatcher: "Dispatcher",
    driver: "Driver",
    viewer: "Viewer",
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-screen bg-dark-50 overflow-hidden">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-dark-950/60 backdrop-blur-sm z-30 lg:hidden transition-opacity"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen ? "w-64" : "w-[72px]"
        } ${
          mobileSidebarOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div
          className={`flex flex-col h-full ${
            sidebarOpen
              ? "bg-gradient-to-b from-dark-900 via-dark-800 to-dark-900"
              : "bg-dark-900"
          }`}
        >
          {/* Logo */}
          <div
            className={`flex items-center h-16 px-4 border-b border-white/10 ${
              !sidebarOpen && "justify-center px-0"
            }`}
          >
            <div className="flex items-center">
              <div className="relative">
                <img src="/logo.svg" alt="RouteMind" className="w-9 h-9 rounded-xl" />
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-secondary-400 rounded-full border-2 border-dark-900 animate-pulse-slow" />
              </div>
              {sidebarOpen && (
                <div className="ml-3">
                  <h1 className="text-lg font-bold text-white tracking-tight">
                    RouteMind
                  </h1>
                  <p className="text-[10px] text-primary-300/60 -mt-0.5 tracking-widest uppercase">
                    Fleet Control
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 mt-6 px-3 space-y-1 overflow-y-auto">
            {sidebarOpen && (
              <p className="px-3 mb-2 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                Operations
              </p>
            )}
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`group relative flex items-center rounded-xl transition-all duration-200 ${
                    sidebarOpen ? "px-3 py-2.5" : "justify-center py-2.5"
                  } ${
                    isActive
                      ? "bg-primary-600/20 text-white"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-400 rounded-r-full" />
                  )}
                  <item.icon
                    className={`w-5 h-5 transition-colors ${
                      sidebarOpen ? "mr-3" : ""
                    } ${
                      isActive
                        ? "text-primary-400"
                        : "text-white/40 group-hover:text-white/70"
                    }`}
                  />
                  {sidebarOpen && (
                    <span
                      className={`text-sm font-medium ${
                        isActive ? "text-white" : ""
                      }`}
                    >
                      {item.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Nav */}
          <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center px-3 py-2.5 rounded-xl transition-all duration-200 ${
                    sidebarOpen ? "" : "justify-center"
                  } ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  }`}
                  title={!sidebarOpen ? item.label : undefined}
                >
                  <item.icon className={`w-5 h-5 ${sidebarOpen ? "mr-3" : ""}`} />
                  {sidebarOpen && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              );
            })}

            {/* Collapse Button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`hidden lg:flex w-full items-center px-3 py-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-200 ${
                !sidebarOpen && "justify-center"
              }`}
            >
              <Menu className={`w-5 h-5 ${sidebarOpen ? "mr-3" : ""}`} />
              {sidebarOpen && (
                <span className="text-sm font-medium">Collapse</span>
              )}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 glass border-b border-dark-100/50 flex items-center justify-between px-4 lg:px-6 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-dark-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-dark-600" />
            </button>

            {/* Breadcrumb */}
            <div className="hidden sm:flex items-center gap-2">
              <span className="text-sm text-dark-400">TransitOps</span>
              <span className="text-dark-300">/</span>
              <span className="text-sm font-semibold text-dark-800">
                {currentPage?.label || "Dashboard"}
              </span>
            </div>

            {/* Search */}
            <div className="hidden md:flex items-center ml-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
                <input
                  type="text"
                  placeholder="Search anything..."
                  className="w-64 pl-9 pr-4 py-2 text-sm bg-dark-100/60 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all"
                />
                <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-dark-400 bg-white px-1.5 py-0.5 rounded border border-dark-200">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl hover:bg-dark-100 transition-colors group">
              <Bell className="w-5 h-5 text-dark-500 group-hover:text-dark-700 transition-colors" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-danger-500 rounded-full ring-2 ring-white animate-pulse" />
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-dark-200 mx-1" />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-dark-100 transition-all"
              >
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-md shadow-primary-500/20">
                  <span className="text-sm font-bold text-white">{userInitials}</span>
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-dark-800 leading-tight">
                    {user?.name || "User"}
                  </p>
                  <p className="text-[11px] text-dark-400">{roleLabels[user?.role] || "Role"}</p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-dark-400 transition-transform duration-200 ${
                    userMenuOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-dark-200/50 border border-dark-100 py-2 z-50 animate-scale-in">
                    <div className="px-4 py-3 border-b border-dark-100">
                      <p className="text-sm font-semibold text-dark-900">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-dark-400 mt-0.5">
                        {user?.email || "user@email.com"}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate("/settings"); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-dark-600 hover:bg-dark-50 transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger-600 hover:bg-danger-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
