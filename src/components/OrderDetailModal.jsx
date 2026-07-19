import React, { useState, useEffect } from "react";
import api from "../utils/api";

const OrderDetailModal = ({ isOpen, onClose, orderId }) => {
  const [order, setOrder] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    } else {
      setOrder(null);
      setHistory([]);
      setError("");
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    setError("");
    try {
      const [orderRes, historyRes] = await Promise.all([
        api.get(`/v1/orders/${orderId}`),
        api.get(`/v1/orders/${orderId}/history`),
      ]);

      setOrder(orderRes.data.data);
      setHistory(historyRes.data.data || []);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to fetch details",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const getStatusColor = (status) => {
    switch (String(status).toUpperCase()) {
      case "PLACED":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "PROCESSING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "READY_TO_SHIP":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "SHIPPED":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "DELIVERED":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "CANCELLED":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (String(status).toUpperCase()) {
      case "PAID":
        return "text-emerald-400 bg-emerald-950/30 border border-emerald-800/30";
      case "PENDING":
        return "text-amber-400 bg-amber-950/30 border border-amber-800/30";
      case "FAILED":
        return "text-red-400 bg-red-950/30 border border-red-800/30";
      case "REFUNDED":
        return "text-blue-400 bg-blue-950/30 border border-blue-800/30";
      default:
        return "text-slate-400 bg-slate-800";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-100 max-h-[90vh] flex flex-col">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />

        <div className="px-6 pt-7 pb-4 flex justify-between items-center border-b border-slate-800/80 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-white">Order Details</h3>
            <p className="text-xs text-slate-400 mt-0.5 font-mono">
              ID:{" "}
              <span className="text-indigo-400 font-semibold">{orderId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-full cursor-pointer"
            aria-label="Close details"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="w-9 h-9 border-3 border-transparent border-t-indigo-500 rounded-full animate-spin"></div>
              <p className="text-sm text-slate-400 font-medium">
                Loading details...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="bg-red-950/20 border border-red-900/30 text-red-400 px-4 py-4 rounded-2xl text-sm flex items-center space-x-3">
              <svg
                className="w-5 h-5 text-red-400 shrink-0"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {!loading && order && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-805 border-slate-800/60 pb-1.5">
                    Customer & Product
                  </h4>
                  <div className="grid grid-cols-3 gap-y-2 text-sm">
                    <span className="text-slate-400">Customer:</span>
                    <span className="col-span-2 text-slate-200 font-medium">
                      {order.customerName}
                    </span>

                    <span className="text-slate-400">Phone:</span>
                    <span className="col-span-2 text-slate-200 font-mono">
                      {order.phoneNumber}
                    </span>

                    <span className="text-slate-400">Product:</span>
                    <span className="col-span-2 text-slate-200 font-medium">
                      {order.productName}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-805 border-slate-800/60 pb-1.5">
                    Status & Transaction
                  </h4>
                  <div className="grid grid-cols-3 gap-y-2.5 text-sm items-center">
                    <span className="text-slate-400">Status:</span>
                    <span className="col-span-2">
                      <span
                        className={`px-2.5 py-0.5 border text-xs font-semibold rounded-md ${getStatusColor(order.orderStatus)}`}
                      >
                        {order.orderStatus}
                      </span>
                    </span>

                    <span className="text-slate-400">Payment:</span>
                    <span className="col-span-2">
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded-md border ${getPaymentStatusColor(order.paymentStatus)}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </span>

                    <span className="text-slate-400">Amount:</span>
                    <span className="col-span-2 text-blue-400 font-bold font-mono">
                      ₹{Number(order.amount).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status History
                  </h4>
                  <div className="flex-1 h-[1px] bg-slate-800/60" />
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-sm italic">
                    No status transitions recorded.
                  </div>
                ) : (
                  <div className="relative border-l border-slate-800 ml-3 pl-6 space-y-4">
                    {history.map((hist, idx) => {
                      const isScheduler = hist.changedBy === "SYSTEM_SCHEDULER";
                      const isAPI = hist.changedBy === "API";
                      const iconColor = isScheduler
                        ? "bg-amber-500/70"
                        : isAPI
                          ? "bg-blue-500/70"
                          : "bg-indigo-500/70";

                      return (
                        <div key={hist._id || idx} className="relative group">
                          <div
                            className={`absolute -left-[30px] top-1.5 w-2.5 h-2.5 rounded-full border border-slate-900 ${iconColor}`}
                          />

                          <div className="bg-slate-950/20 hover:bg-slate-950/50 border border-slate-800/80 rounded-xl p-3.5 space-y-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                              <div className="flex items-center space-x-2 flex-wrap">
                                {hist.fromStatus ? (
                                  <>
                                    <span className="text-xs font-mono text-slate-400">
                                      {hist.fromStatus}
                                    </span>
                                    <svg
                                      className="w-3 h-3 text-slate-500 shrink-0"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                                      />
                                    </svg>
                                  </>
                                ) : (
                                  <span className="text-xs font-mono text-slate-500 italic">
                                    None
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 border text-xs font-semibold rounded-md ${getStatusColor(hist.toStatus)}`}
                                >
                                  {hist.toStatus}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 shrink-0">
                                {formatDate(hist.createdAt)}
                              </span>
                            </div>

                            <div className="text-xs mt-1.5 flex items-center space-x-1.5">
                              <span className="text-slate-405 text-slate-405 text-slate-400">
                                Trigger:
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  isScheduler
                                    ? "bg-amber-950/40 text-amber-400 border border-amber-900/40"
                                    : isAPI
                                      ? "bg-blue-950/40 text-blue-400 border border-blue-900/40"
                                      : "bg-indigo-950/40 text-indigo-400 border border-indigo-900/40"
                                }`}
                              >
                                {hist.changedBy}
                              </span>
                            </div>

                            {hist.note && (
                              <p className="text-xs text-slate-300 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40 mt-2 italic font-medium">
                                &ldquo;{hist.note}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="text-[10px] text-slate-500 border-t border-slate-800/80 pt-4 flex justify-between shrink-0">
                <span>Created: {formatDate(order.createdAt)}</span>
                <span>Last Updated: {formatDate(order.updatedAt)}</span>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-800/85 shrink-0 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
