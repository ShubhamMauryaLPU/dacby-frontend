import React, { useState, useEffect } from "react";
import api from "../utils/api";

const SchedulerDashboard = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [secretKey, setSecretKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchLogs();
  }, [page]);

  const fetchLogs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/v1/scheduler/logs", {
        params: {
          page,
          limit: 10,
        },
      });
      const result = response.data;
      setLogs(result.data || []);
      setPagination(result.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Could not fetch logs",
      );
    } finally {
      setLoading(false);
    }
  };

  const triggerScheduler = async () => {
    let currentKey = secretKey;
    if (!currentKey || !currentKey.trim()) {
      const promptedKey = prompt(
        "Please enter the secret key to trigger the scheduler:",
      );
      if (!promptedKey || !promptedKey.trim()) {
        setError(
          "Permission denied: Secret key is required to trigger manually.",
        );
        return;
      }
      currentKey = promptedKey.trim();
      setSecretKey(currentKey);
    }

    setTriggering(true);
    setError("");
    setSuccessMsg("");
    try {
      const response = await api.post(
        "/v1/scheduler/run-status-update",
        {},
        {
          headers: {
            "x-scheduler-secret": currentKey,
          },
        },
      );

      const result = response.data;
      setSuccessMsg(
        `Pass completed! Scanned: ${result.data?.ordersScanned || 0}, Updated: ${result.data?.ordersUpdated || 0}`,
      );

      setTimeout(() => {
        setPage(1);
        fetchLogs();
        setSuccessMsg("");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Task failed to execute",
      );
    } finally {
      setTriggering(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-md relative overflow-hidden backdrop-blur-sm">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Scheduler Controller
            </h3>
            <p className="text-sm text-slate-400">
              Trigger background state-updates manually or let the local cron
              worker poll order records.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="relative">
              <input
                type="password"
                placeholder="Secret Key"
                value={secretKey}
                onChange={(e) => setSecretKey(e.target.value)}
                className="w-full sm:w-48 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-350 placeholder-slate-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <button
              onClick={triggerScheduler}
              disabled={triggering}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-orange-500/10 flex items-center justify-center space-x-2 min-w-[160px] cursor-pointer"
            >
              {triggering ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 text-white shrink-0"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 5.25v13.5m-7.5-13.5v13.5"
                    />
                  </svg>
                  <span>Trigger Scheduler</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-950/20 border border-red-900/30 text-red-300 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
            <span>⚠️ {error}</span>
          </div>
        )}
        {successMsg && (
          <div className="mt-4 bg-emerald-950/20 border border-emerald-900/30 text-emerald-300 px-4 py-3 rounded-xl text-xs flex items-center space-x-2">
            <span>✅ {successMsg}</span>
          </div>
        )}
      </div>

      <div className="bg-slate-900/20 border border-slate-800 rounded-3xl overflow-hidden shadow-lg backdrop-blur-sm">
        <div className="px-6 py-5 border-b border-slate-800/80 flex justify-between items-center bg-slate-950/20">
          <div>
            <h4 className="text-base font-bold text-slate-100">
              Execution Logs
            </h4>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Logs showing job executions, durations, counts, and status
              breakdowns.
            </p>
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 border border-slate-800 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-205 transition-colors cursor-pointer"
            title="Refresh Logs"
          >
            <svg
              className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0L20.81 3.56a9.965 9.965 0 00-11.83 2.16L4.567 9.873"
              />
            </svg>
          </button>
        </div>

        {loading && logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-transparent border-t-amber-500 rounded-full animate-spin font-medium"></div>
            <p className="text-xs">Loading execution logs...</p>
          </div>
        ) : error && logs.length === 0 ? (
          <div className="py-12 text-center text-red-400 text-sm">
            Failed to retrieve historical logs.
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-sm italic">
            No system execution logs recorded yet. Use the run-controller
            trigger button to generate a log.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/40 text-slate-400 text-[10px] font-bold uppercase tracking-wider border-b border-slate-800/80">
                  <th className="py-3.5 px-6">Timestamp / Run ID</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Duration</th>
                  <th className="py-3.5 px-4 text-right">Scanned</th>
                  <th className="py-3.5 px-4 text-right">Updated</th>
                  <th className="py-3.5 px-6">Transitions Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {logs.map((log) => (
                  <tr
                    key={log.runId}
                    className="hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="py-4 px-6 space-y-0.5">
                      <div className="text-slate-300 font-medium">
                        {formatDate(log.startedAt)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono select-all truncate max-w-[150px]">
                        {log.runId}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-900/35"
                            : "bg-red-950/40 text-red-400 border-red-900/35"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right font-mono text-slate-405 text-slate-450">
                      {log.durationMs !== undefined
                        ? `${log.durationMs}ms`
                        : "-"}
                    </td>
                    <td className="py-4 px-4 text-right text-slate-350 text-slate-300 font-mono">
                      {log.ordersScanned || 0}
                    </td>
                    <td className="py-4 px-4 text-right text-orange-400 font-bold font-mono">
                      {log.ordersUpdated || 0}
                    </td>
                    <td className="py-4 px-6">
                      {log.transitionsSummary &&
                      Object.keys(log.transitionsSummary).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-[280px]">
                          {Object.entries(log.transitionsSummary).map(
                            ([transition, count]) => (
                              <span
                                key={transition}
                                className="bg-slate-950/80 border border-slate-800 text-[10.5px] px-2 py-0.5 rounded text-amber-350 font-mono"
                              >
                                {transition}:{" "}
                                <span className="font-bold text-white">
                                  {count}
                                </span>
                              </span>
                            ),
                          )}
                        </div>
                      ) : log.errorMessage ? (
                        <span className="text-[10.5px] text-red-400 italic">
                          {log.errorMessage}
                        </span>
                      ) : (
                        <span className="text-[10.5px] text-slate-500 italic">
                          No transitions needed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-950/20 border-t border-slate-800/80 flex justify-between items-center shrink-0">
            <span className="text-xs text-slate-500">
              Showing page {page} of {pagination.totalPages}
            </span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 hover:bg-slate-750 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchedulerDashboard;
