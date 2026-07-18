import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../utils/api";
import OrderCreateModal from "./OrderCreateModal";
import OrderDetailModal from "./OrderDetailModal";
import SchedulerDashboard from "./SchedulerDashboard";

const Dashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation tab state derived from URL route path
  const activeTab = location.pathname === "/scheduler" ? "scheduler" : "orders";

  // Orders table states
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  // Stats summaries
  const [stats, setStats] = useState({
    total: 0,
    placed: 0,
    processing: 0,
    ready: 0,
  });

  // Auto-refresh state
  const [autoRefreshSecs, setAutoRefreshSecs] = useState(30);
  const [countdown, setCountdown] = useState(30);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  // Auto-refresh timer reference
  const countdownIntervalRef = useRef(null);

  // Fetch orders and stats
  useEffect(() => {
    if (activeTab === "orders") {
      fetchOrders();
    }
  }, [statusFilter, searchQuery, page, activeTab]);

  // Setup auto-refresh countdown
  useEffect(() => {
    setCountdown(autoRefreshSecs);
  }, [autoRefreshSecs]);

  useEffect(() => {
    if (countdownIntervalRef.current)
      clearInterval(countdownIntervalRef.current);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (activeTab === "orders") fetchOrders();
          return autoRefreshSecs;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownIntervalRef.current);
  }, [autoRefreshSecs, activeTab]);

  const fetchOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        page,
        limit: 10,
      };
      if (statusFilter) {
        params.status = statusFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await api.get("/v1/orders", { params });
      const data = response.data;
      setOrders(data.data || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });

      fetchStats();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load order dashboard",
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statuses = ["PLACED", "PROCESSING", "READY_TO_SHIP"];
      const fetches = statuses.map((status) =>
        api
          .get("/v1/orders", { params: { status, limit: 1 } })
          .then((res) => res.data.pagination?.total || 0)
          .catch(() => 0),
      );

      // fetch total
      const totalFetch = api
        .get("/v1/orders", { params: { limit: 1 } })
        .then((res) => res.data.pagination?.total || 0)
        .catch(() => 0);

      const [placed, processing, ready, total] = await Promise.all([
        ...fetches,
        totalFetch,
      ]);
      setStats({ total, placed, processing, ready });
    } catch (err) {
      console.error("Failed to update stats summary", err);
    }
  };

  const handleOrderCreated = () => {
    setPage(1);
    fetchOrders();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    switch (String(status).toUpperCase()) {
      case "PLACED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-550/25 text-blue-400">
            Placed
          </span>
        );
      case "PROCESSING":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/10 border border-amber-550/25 text-amber-400">
            Processing
          </span>
        );
      case "READY_TO_SHIP":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 border border-indigo-550/25 text-indigo-400">
            Ready to Ship
          </span>
        );
      case "SHIPPED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-500/10 border border-purple-550/25 text-purple-400">
            Shipped
          </span>
        );
      case "DELIVERED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-550/25 text-emerald-400">
            Delivered
          </span>
        );
      case "CANCELLED":
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-500/10 border border-red-550/25 text-red-400">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-500/10 border border-slate-550/25 text-slate-400">
            {status}
          </span>
        );
    }
  };

  const getPaymentBadge = (status) => {
    switch (String(status).toUpperCase()) {
      case "PAID":
        return (
          <span className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 font-bold"></span>
            Paid
          </span>
        );
      case "PENDING":
        return (
          <span className="text-amber-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 font-bold"></span>
            Pending
          </span>
        );
      case "FAILED":
        return (
          <span className="text-red-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 font-bold"></span>
            Failed
          </span>
        );
      case "REFUNDED":
        return (
          <span className="text-blue-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 font-bold"></span>
            Refunded
          </span>
        );
      default:
        return <span className="text-slate-400">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-250 select-none pb-12">
      {/* Top Banner Gradient */}
      <div className="h-64 w-full bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-900 absolute top-0 left-0 z-0 opacity-40 blur-2xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-8 space-y-8">
        {/* Navigation / Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-900 pb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Dacby <span className="text-blue-500 font-light">OrderFlow</span>
            </h1>
            <p className="text-sm text-slate-450 mt-1 text-slate-400">
              Operations Control Panel & Cloud Scheduler Monitor
            </p>
          </div>

          {/* Tab buttons tied to react-router routes */}
          <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => navigate("/")}
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === "orders"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Order Desk
            </button>
            <button
              onClick={() => navigate("/scheduler")}
              className={`px-5 py-2 text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                activeTab === "scheduler"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Scheduler Monitor
            </button>
          </div>
        </header>

        {/* Stats summary widgets (Only visible in orders tab) */}
        {activeTab === "orders" && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800/85 hover:border-slate-700/80 transition-all rounded-3xl p-5 shadow-lg relative group overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-15 group-hover:scale-110 transition-transform">
                <svg
                  className="w-16 h-16 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Total Entries
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {stats.total}
              </h3>
            </div>

            <div
              onClick={() =>
                setStatusFilter(statusFilter === "PLACED" ? "" : "PLACED")
              }
              className={`bg-slate-900 border transition-all rounded-3xl p-5 shadow-lg relative group cursor-pointer overflow-hidden ${
                statusFilter === "PLACED"
                  ? "border-blue-500 bg-slate-900/90 shadow-blue-500/5"
                  : "border-slate-800/85 hover:border-slate-700/80"
              }`}
            >
              <div className="absolute top-0 right-0 p-3 opacity-15 group-hover:scale-110 transition-transform">
                <svg
                  className="w-16 h-16 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                Placed Status
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {stats.placed}
              </h3>
            </div>

            <div
              onClick={() =>
                setStatusFilter(
                  statusFilter === "PROCESSING" ? "" : "PROCESSING",
                )
              }
              className={`bg-slate-900 border transition-all rounded-3xl p-5 shadow-lg relative group cursor-pointer overflow-hidden ${
                statusFilter === "PROCESSING"
                  ? "border-amber-500 bg-slate-900/90 shadow-amber-500/5"
                  : "border-slate-800/85 hover:border-slate-700/80"
              }`}
            >
              <div className="absolute top-0 right-0 p-3 opacity-15 group-hover:scale-110 transition-transform">
                <svg
                  className="w-16 h-16 text-amber-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                  />
                </svg>
              </div>
              <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">
                Processing
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {stats.processing}
              </h3>
            </div>

            <div
              onClick={() =>
                setStatusFilter(
                  statusFilter === "READY_TO_SHIP" ? "" : "READY_TO_SHIP",
                )
              }
              className={`bg-slate-900 border transition-all rounded-3xl p-5 shadow-lg relative group cursor-pointer overflow-hidden ${
                statusFilter === "READY_TO_SHIP"
                  ? "border-indigo-500 bg-slate-900/90 shadow-indigo-500/5"
                  : "border-slate-800/85 hover:border-slate-700/80"
              }`}
            >
              <div className="absolute top-0 right-0 p-3 opacity-15 group-hover:scale-110 transition-transform">
                <svg
                  className="w-16 h-16 text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.12-1.243l1.094-10.42a1.125 1.125 0 011.12-.98h15.262a1.125 1.125 0 011.12.98l1.093 10.419a1.125 1.125 0 01-1.12 1.243H14.25m0 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0H9"
                  />
                </svg>
              </div>
              <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                Ready to Ship
              </p>
              <h3 className="text-3xl font-extrabold text-white mt-2">
                {stats.ready}
              </h3>
            </div>
          </section>
        )}

        {/* Tab Content Display */}
        {activeTab === "scheduler" ? (
          <SchedulerDashboard />
        ) : (
          <div className="space-y-6 animate-fade-in">
            {/* Filter and Control Toolbar */}
            <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-3 grow">
                {/* Search query input */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search by ID or customer..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium"
                  />
                  <div className="absolute left-3.5 top-3.5 text-slate-650">
                    <svg
                      className="w-4 h-4 text-slate-500"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.604 10.604z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Status Dropdown */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setPage(1);
                    }}
                    className="w-full sm:w-48 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-200 select-dark"
                  >
                    <option value="">All Statuses</option>
                    <option value="PLACED">Placed</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="READY_TO_SHIP">Ready to Ship</option>
                    <option value="SHIPPED">Shipped</option>
                    <option value="DELIVERED">Delivered</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Refresh and Action buttons */}
              <div className="flex items-center gap-3 shrink-0">
                {/* Auto Refresh indicator */}
                <div className="hidden lg:flex items-center space-x-2 bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl text-xs text-slate-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
                  <span>
                    Polling in{" "}
                    <span className="font-bold font-mono text-white">
                      {countdown}
                    </span>
                    s
                  </span>

                  {/* Dropdown to adjust poll rate */}
                  <select
                    value={autoRefreshSecs}
                    onChange={(e) => setAutoRefreshSecs(Number(e.target.value))}
                    className="bg-transparent border-0 font-bold focus:outline-none text-[10px] ml-1.5 text-slate-300"
                  >
                    <option value="15">15s</option>
                    <option value="30">30s</option>
                    <option value="60">60s</option>
                  </select>
                </div>

                <button
                  onClick={fetchOrders}
                  disabled={loading}
                  className="p-3 border border-slate-800 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
                  title="Manual refresh"
                >
                  <svg
                    className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0L20.81 3.56a9.965 9.965 0 00-11.83 2.16L4.567 9.873"
                    />
                  </svg>
                </button>

                <button
                  onClick={() => setIsCreateOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl text-sm flex items-center gap-1.5 shadow-md shadow-blue-500/10 hover:shadow-blue-550/20 transition-all cursor-pointer"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  <span>Place Order</span>
                </button>
              </div>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="bg-red-950/30 border border-red-900/40 text-red-300 px-4 py-3 rounded-2xl text-sm flex items-center space-x-2">
                <span>⚠️ {error}</span>
              </div>
            )}

            {/* Orders Table Container */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
              {loading && orders.length === 0 ? (
                <div className="py-24 text-center text-slate-500 flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-sm font-medium">
                    Scanning catalog records...
                  </p>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-24 text-center space-y-3.5">
                  <div className="w-16 h-16 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-650 shadow-inner">
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 13.5h3.86a2.25 2.25 0 012.008 1.24l.885 1.77a2.25 2.25 0 002.007 1.24h1.98a2.25 2.25 0 002.007-1.24l.885-1.77a2.25 2.25 0 012.007-1.24h3.86m-18 0h18m-18 0l-1.07-5.35A2.25 2.25 0 014.244 5.25h15.512a2.25 2.25 0 012.188 2.58l-1.07 5.35m-14.74 0c-.822 0-1.503.587-1.636 1.39l-1.07 6.42A2.25 2.25 0 004.244 21.75h15.512A2.25 2.25 0 0021.936 19.3l-1.07-6.42a1.5 1.5 0 00-1.636-1.39H4.24z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h5 className="text-base font-bold text-slate-300">
                      No Orders Found
                    </h5>
                    <p className="text-xs text-slate-500 mt-1">
                      There are no records matching your active filter criteria.
                    </p>
                  </div>
                  <div>
                    <button
                      onClick={() => setIsCreateOpen(true)}
                      className="px-4 py-2 bg-slate-805 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-850 border-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Place First Order
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-855 border-slate-800">
                        <th className="py-4 px-6">Order ID & Date</th>
                        <th className="py-4 px-4">Customer Info</th>
                        <th className="py-4 px-4">Item Details</th>
                        <th className="py-4 px-4 text-right">Value</th>
                        <th className="py-4 px-4 text-center">Status</th>
                        <th className="py-4 px-4">Payment</th>
                        <th className="py-4 px-6 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50 text-xs">
                      {orders.map((ord) => (
                        <tr
                          key={ord.orderId}
                          className="hover:bg-slate-950/20 transition-all"
                        >
                          <td className="py-4 px-6">
                            <span
                              onClick={() => setSelectedOrderId(ord.orderId)}
                              className="text-white hover:text-blue-400 cursor-pointer font-bold font-mono hover:underline block"
                            >
                              {ord.orderId}
                            </span>
                            <span className="text-[10px] text-slate-500 block mt-0.5">
                              {formatDate(ord.createdAt)}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="font-semibold text-slate-205 text-slate-200">
                              {ord.customerName}
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {ord.phoneNumber}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div
                              className="text-slate-350 text-slate-300 truncate max-w-[160px]"
                              title={ord.productName}
                            >
                              {ord.productName}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right font-bold text-white font-mono">
                            ₹{Number(ord.amount).toLocaleString("en-IN")}
                          </td>
                          <td className="py-4 px-4 text-center select-none">
                            {getStatusBadge(ord.orderStatus)}
                          </td>
                          <td className="py-4 px-4">
                            {getPaymentBadge(ord.paymentStatus)}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <button
                              onClick={() => setSelectedOrderId(ord.orderId)}
                              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold transition-all hover:text-white cursor-pointer"
                            >
                              Timeline
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table Pagination controls */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 bg-slate-950/10 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    Showing page {page} of {pagination.totalPages} (
                    {pagination.total} entries)
                  </span>
                  <div className="flex space-x-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-755 text-slate-350 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal wrapper */}
      <OrderCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onOrderCreated={handleOrderCreated}
      />

      {/* Detail Modal Visualizer */}
      <OrderDetailModal
        isOpen={selectedOrderId !== null}
        onClose={() => setSelectedOrderId(null)}
        orderId={selectedOrderId}
      />
    </div>
  );
};

export default Dashboard;
