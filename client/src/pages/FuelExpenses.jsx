import { useState, useEffect, useCallback } from "react";
import {
  Fuel,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit3,
  Trash2,
  Truck,
  FileText,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import FuelForm from "../components/FuelForm";
import ExpenseForm from "../components/ExpenseForm";

const fuelCategoryConfig = {
  diesel: { label: "Diesel", bg: "bg-primary-50", text: "text-primary-700" },
  petrol: { label: "Petrol", bg: "bg-dark-100", text: "text-dark-600" },
  cng: { label: "CNG", bg: "bg-secondary-50", text: "text-secondary-700" },
  electric: { label: "Electric", bg: "bg-purple-50", text: "text-purple-700" },
};

const expenseCategoryConfig = {
  toll: { label: "Toll", bg: "bg-dark-100", text: "text-dark-600", icon: FileText },
  repair: { label: "Repair", bg: "bg-warning-50", text: "text-warning-700", icon: TrendingUp },
  insurance: { label: "Insurance", bg: "bg-secondary-50", text: "text-secondary-700", icon: TrendingDown },
  parking: { label: "Parking", bg: "bg-primary-50", text: "text-primary-700", icon: FileText },
  permit: { label: "Permit", bg: "bg-purple-50", text: "text-purple-700", icon: FileText },
  fine: { label: "Fine", bg: "bg-danger-50", text: "text-danger-700", icon: AlertCircle },
  other: { label: "Other", bg: "bg-dark-100", text: "text-dark-600", icon: DollarSign },
};

function FuelExpenses() {
  const [activeTab, setActiveTab] = useState("fuel");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Fuel state
  const [fuelLogs, setFuelLogs] = useState([]);
  const [fuelLoading, setFuelLoading] = useState(true);
  const [fuelSummary, setFuelSummary] = useState({ total: 0, totalQuantity: 0, totalCost: 0, monthCost: 0, monthQuantity: 0 });

  // Expense state
  const [expenses, setExpenses] = useState([]);
  const [expenseLoading, setExpenseLoading] = useState(true);
  const [expenseSummary, setExpenseSummary] = useState({ total: 0, totalAmount: 0, monthAmount: 0 });

  // Modals
  const [fuelFormOpen, setFuelFormOpen] = useState(false);
  const [editFuelLog, setEditFuelLog] = useState(null);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const { api, isDispatcher } = useAuth();

  const fetchFuelLogs = useCallback(async () => {
    setFuelLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.append("fuelType", categoryFilter);
      if (search) params.append("search", search);
      const res = await api.get(`/fuel?${params.toString()}`);
      setFuelLogs(res.data.logs);
      setFuelSummary(res.data.summary);
    } catch (err) {
      toast.error("Failed to load fuel logs");
    } finally {
      setFuelLoading(false);
    }
  }, [categoryFilter, search]);

  const fetchExpenses = useCallback(async () => {
    setExpenseLoading(true);
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== "all") params.append("category", categoryFilter);
      if (search) params.append("search", search);
      const res = await api.get(`/expenses?${params.toString()}`);
      setExpenses(res.data.expenses);
      setExpenseSummary(res.data.summary);
    } catch (err) {
      toast.error("Failed to load expenses");
    } finally {
      setExpenseLoading(false);
    }
  }, [categoryFilter, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "fuel") fetchFuelLogs();
      else fetchExpenses();
    }, 300);
    return () => clearTimeout(timer);
  }, [activeTab, fetchFuelLogs, fetchExpenses]);

  const handleSaveFuel = async (data) => {
    try {
      if (editFuelLog) {
        await api.put(`/fuel/${editFuelLog._id}`, data);
        toast.success("Fuel log updated");
      } else {
        await api.post("/fuel", data);
        toast.success("Fuel log added");
      }
      fetchFuelLogs();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save fuel log");
      throw err;
    }
  };

  const handleSaveExpense = async (data) => {
    try {
      if (editExpense) {
        await api.put(`/expenses/${editExpense._id}`, data);
        toast.success("Expense updated");
      } else {
        await api.post("/expenses", data);
        toast.success("Expense added");
      }
      fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save expense");
      throw err;
    }
  };

  const handleDelete = async (type, id) => {
    try {
      await api.delete(`/${type}/${id}`);
      toast.success(`${type === "fuel" ? "Fuel log" : "Expense"} deleted`);
      setDeleteConfirm(null);
      if (type === "fuel") fetchFuelLogs();
      else fetchExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const formatCost = (cost) => {
    if (cost == null) return "₹0";
    return `₹${Number(cost).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  };

  const tabs = [
    { id: "fuel", label: "Fuel Logs", icon: Fuel },
    { id: "expenses", label: "Expenses", icon: FileText },
  ];

  const currentLoading = activeTab === "fuel" ? fuelLoading : expenseLoading;
  const currentCount = activeTab === "fuel" ? fuelLogs.length : expenses.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-dark-900 tracking-tight">Fuel & Expenses</h1>
          <p className="text-dark-400 mt-1">Track fuel consumption and operational expenses</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => (activeTab === "fuel" ? fetchFuelLogs() : fetchExpenses())} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${currentLoading ? "animate-spin" : ""}`} />
          </button>
          {isDispatcher && (
            <button
              onClick={() => {
                if (activeTab === "fuel") { setEditFuelLog(null); setFuelFormOpen(true); }
                else { setEditExpense(null); setExpenseFormOpen(true); }
              }}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              {activeTab === "fuel" ? "Add Fuel Log" : "Add Expense"}
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {activeTab === "fuel" ? (
          <>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 p-2.5 rounded-xl"><Fuel className="w-5 h-5 text-primary-600" /></div>
                <div>
                  <p className="text-xs text-dark-400">Total Fuel Logs</p>
                  <p className="text-xl font-bold text-dark-900">{fuelSummary.total}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 p-2.5 rounded-xl"><TrendingUp className="w-5 h-5 text-primary-600" /></div>
                <div>
                  <p className="text-xs text-dark-400">Total Fuel Cost</p>
                  <p className="text-xl font-bold text-dark-900">{formatCost(fuelSummary.totalCost)}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="bg-secondary-50 p-2.5 rounded-xl"><Fuel className="w-5 h-5 text-secondary-600" /></div>
                <div>
                  <p className="text-xs text-dark-400">Total Liters</p>
                  <p className="text-xl font-bold text-dark-900">{fuelSummary.totalQuantity?.toLocaleString("en-IN") || 0} L</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="bg-warning-50 p-2.5 rounded-xl"><DollarSign className="w-5 h-5 text-warning-600" /></div>
                <div>
                  <p className="text-xs text-dark-400">This Month</p>
                  <p className="text-xl font-bold text-dark-900">{formatCost(fuelSummary.monthCost)}</p>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 p-2.5 rounded-xl"><FileText className="w-5 h-5 text-primary-600" /></div>
                <div>
                  <p className="text-xs text-dark-400">Total Expenses</p>
                  <p className="text-xl font-bold text-dark-900">{expenseSummary.total}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="bg-primary-50 p-2.5 rounded-xl"><DollarSign className="w-5 h-5 text-primary-600" /></div>
                <div>
                  <p className="text-xs text-dark-400">Total Amount</p>
                  <p className="text-xl font-bold text-dark-900">{formatCost(expenseSummary.totalAmount)}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="bg-warning-50 p-2.5 rounded-xl"><TrendingUp className="w-5 h-5 text-warning-600" /></div>
                <div>
                  <p className="text-xs text-dark-400">This Month</p>
                  <p className="text-xl font-bold text-dark-900">{formatCost(expenseSummary.monthAmount)}</p>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-3">
                <div className="bg-secondary-50 p-2.5 rounded-xl"><TrendingDown className="w-5 h-5 text-secondary-600" /></div>
                <div>
                  <p className="text-xs text-dark-400">Avg per Expense</p>
                  <p className="text-xl font-bold text-dark-900">
                    {expenseSummary.total > 0 ? formatCost(expenseSummary.totalAmount / expenseSummary.total) : "₹0"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-dark-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setSearch(""); setCategoryFilter("all"); }}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === tab.id ? "bg-white text-dark-900 shadow-sm" : "text-dark-500 hover:text-dark-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
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
              placeholder={`Search ${activeTab === "fuel" ? "fuel logs" : "expenses"}...`}
              className="input-field pl-10 text-sm"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input-field w-auto text-sm"
          >
            {activeTab === "fuel" ? (
              <>
                <option value="all">All Fuel Types</option>
                <option value="diesel">Diesel</option>
                <option value="petrol">Petrol</option>
                <option value="cng">CNG</option>
                <option value="electric">Electric</option>
              </>
            ) : (
              <>
                <option value="all">All Categories</option>
                <option value="toll">Toll</option>
                <option value="repair">Repair</option>
                <option value="insurance">Insurance</option>
                <option value="parking">Parking</option>
                <option value="permit">Permit</option>
                <option value="fine">Fine</option>
                <option value="other">Other</option>
              </>
            )}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                {activeTab === "fuel" ? (
                  <>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Vehicle</th>
                    <th className="text-left px-4 py-3">Driver</th>
                    <th className="text-left px-4 py-3">Fuel Type</th>
                    <th className="text-left px-4 py-3">Quantity</th>
                    <th className="text-left px-4 py-3">Station</th>
                    <th className="text-right px-4 py-3">Total Cost</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="text-left px-4 py-3">Date</th>
                    <th className="text-left px-4 py-3">Vehicle</th>
                    <th className="text-left px-4 py-3">Category</th>
                    <th className="text-left px-4 py-3">Description</th>
                    <th className="text-left px-4 py-3">Driver</th>
                    <th className="text-right px-4 py-3">Amount</th>
                    <th className="text-right px-4 py-3">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {currentLoading ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center">
                    <Loader2 className="w-8 h-8 text-primary-500 mx-auto mb-3 animate-spin" />
                    <p className="text-sm text-dark-500">Loading...</p>
                  </td>
                </tr>
              ) : activeTab === "fuel" ? (
                fuelLogs.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center">
                      <img src="/empty-data.svg" alt="No fuel logs" className="w-40 h-auto mx-auto mb-3 opacity-80" />
                      <p className="text-sm text-dark-500 font-medium">No fuel logs found</p>
                      <p className="text-xs text-dark-400 mt-1">{isDispatcher ? "Click 'Add Fuel Log' to get started" : "No fuel logs match your search"}</p>
                    </td>
                  </tr>
                ) : (
                  fuelLogs.map((log) => {
                    const ft = fuelCategoryConfig[log.fuelType] || fuelCategoryConfig.diesel;
                    return (
                      <tr key={log._id} className="border-b border-dark-50 hover:bg-dark-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-dark-500 whitespace-nowrap">
                          {new Date(log.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-dark-400" />
                            <span className="font-mono font-semibold text-dark-800 text-sm">{log.vehicle?.registrationNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-500">{log.driver?.name || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${ft.bg} ${ft.text}`}>
                            {ft.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-600">{log.quantity} {log.unit || "L"}</td>
                        <td className="px-4 py-3 text-sm text-dark-500 max-w-[160px] truncate">{log.fuelStation || "—"}</td>
                        <td className="px-4 py-3 text-sm font-bold text-dark-800 text-right">{formatCost(log.totalCost)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isDispatcher && (
                              <>
                                <button onClick={() => { setEditFuelLog(log); setFuelFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400 hover:text-primary-600 transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button onClick={() => setDeleteConfirm({ type: "fuel", item: log })} className="p-1.5 rounded-lg hover:bg-danger-50 text-dark-400 hover:text-danger-600 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : (
                expenses.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center">
                      <img src="/empty-data.svg" alt="No expenses" className="w-40 h-auto mx-auto mb-3 opacity-80" />
                      <p className="text-sm text-dark-500 font-medium">No expenses found</p>
                      <p className="text-xs text-dark-400 mt-1">{isDispatcher ? "Click 'Add Expense' to get started" : "No expenses match your search"}</p>
                    </td>
                  </tr>
                ) : (
                  expenses.map((expense) => {
                    const cat = expenseCategoryConfig[expense.category] || expenseCategoryConfig.other;
                    return (
                      <tr key={expense._id} className="border-b border-dark-50 hover:bg-dark-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm text-dark-500 whitespace-nowrap">
                          {new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-dark-400" />
                            <span className="font-mono font-semibold text-dark-800 text-sm">{expense.vehicle?.registrationNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${cat.bg} ${cat.text}`}>
                            {cat.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-dark-600 max-w-[220px] truncate">{expense.description}</td>
                        <td className="px-4 py-3 text-sm text-dark-500">{expense.driver?.name || "—"}</td>
                        <td className="px-4 py-3 text-sm font-bold text-dark-800 text-right">{formatCost(expense.amount)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isDispatcher && (
                              <>
                                <button onClick={() => { setEditExpense(expense); setExpenseFormOpen(true); }} className="p-1.5 rounded-lg hover:bg-primary-50 text-dark-400 hover:text-primary-600 transition-colors">
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button onClick={() => setDeleteConfirm({ type: "expenses", item: expense })} className="p-1.5 rounded-lg hover:bg-danger-50 text-dark-400 hover:text-danger-600 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>

        {!currentLoading && currentCount > 0 && (
          <div className="px-4 py-3 border-t border-dark-100 flex items-center justify-between text-sm text-dark-500">
            <span>Showing {currentCount} {activeTab === "fuel" ? "fuel logs" : "expenses"}</span>
          </div>
        )}
      </div>

      {/* Modals */}
      <FuelForm
        isOpen={fuelFormOpen}
        onClose={() => { setFuelFormOpen(false); setEditFuelLog(null); }}
        log={editFuelLog}
        onSave={handleSaveFuel}
      />

      <ExpenseForm
        isOpen={expenseFormOpen}
        onClose={() => { setExpenseFormOpen(false); setEditExpense(null); }}
        expense={editExpense}
        onSave={handleSaveExpense}
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
                <h3 className="font-bold text-dark-900">Delete {deleteConfirm.type === "fuel" ? "Fuel Log" : "Expense"}</h3>
                <p className="text-xs text-dark-400">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-dark-600 mb-6">Are you sure you want to delete this record?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm.type, deleteConfirm.item._id)} className="btn-danger text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FuelExpenses;
