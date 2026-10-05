import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { io, Socket } from "socket.io-client";
import {
  ScrollText,
  Play,
  Square,
  RotateCw,
  Trash2,
  AlertTriangle,
  Search,
  RefreshCw,
  Download,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Server,
  FileText,
  Archive,
  ChevronDown,
  ChevronUp,
  X,
  Shield,
  Layers,
  Sparkles
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

interface AuditLog {
  id: string;
  timestamp: string;
  action: "SERVER_START" | "SERVER_STOP" | "SERVER_RESTART" | "FILE_DELETE" | "SERVER_DELETE" | "SERVER_CREATE" | "SERVER_COMMAND" | "BACKUP_DELETE";
  serverId?: string;
  serverName?: string;
  userId: string;
  username: string;
  userRole?: string;
  ip: string;
  details: string;
  metadata?: {
    paths?: string[];
    count?: number;
    [key: string]: any;
  };
  status: "success" | "failed";
}

interface LogSummary {
  total: number;
  starts: number;
  stops: number;
  restarts: number;
  fileDeletions: number;
  serverDeletions: number;
}

export default function AdminLogs() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [summary, setSummary] = useState<LogSummary>({
    total: 0,
    starts: 0,
    stops: 0,
    restarts: 0,
    fileDeletions: 0,
    serverDeletions: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [serverFilter, setServerFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Expanded row metadata modal/accordion state
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // List of distinct servers for filter dropdown
  const [serverList, setServerList] = useState<{ id: string; name: string }[]>([]);

  const socketRef = useRef<Socket | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // Fetch servers for the server dropdown
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const res = await axios.get("/api/servers");
        if (Array.isArray(res.data)) {
          setServerList(res.data.map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch (err) {
        // Ignore fallback
      }
    };
    fetchServers();
  }, []);

  const fetchLogs = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const params: Record<string, any> = {
        page,
        limit
      };
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (actionFilter !== "ALL") params.action = actionFilter;
      if (serverFilter !== "ALL") params.serverId = serverFilter;

      const res = await axios.get("/api/admin/audit-logs", { params });
      setLogs(res.data.logs || []);
      setTotalLogs(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      if (res.data.summary) {
        setSummary(res.data.summary);
      }
    } catch (err: any) {
      if (!isSilent) {
        showToast("Failed to fetch audit logs", "error");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, limit, searchQuery, actionFilter, serverFilter]);

  // Initial fetch and on filter/page change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Live Socket.io updates for new audit logs
  useEffect(() => {
    const token = localStorage.getItem("token");
    const socket = io({
      auth: { token },
      transports: ["websocket", "polling"]
    });
    socketRef.current = socket;

    socket.on("audit_log_created", (newLog: AuditLog) => {
      // If auto-refresh is on and we are on page 1 with compatible filters
      if (autoRefresh && page === 1) {
        setLogs(prev => {
          // Check if matches active action filter
          if (actionFilter !== "ALL" && newLog.action !== actionFilter) return prev;
          if (serverFilter !== "ALL" && newLog.serverId !== serverFilter) return prev;
          if (searchQuery.trim()) {
            const s = searchQuery.toLowerCase();
            const matches = 
              newLog.details.toLowerCase().includes(s) ||
              (newLog.serverName && newLog.serverName.toLowerCase().includes(s)) ||
              newLog.username.toLowerCase().includes(s) ||
              newLog.ip.toLowerCase().includes(s);
            if (!matches) return prev;
          }
          const updated = [newLog, ...prev.filter(l => l.id !== newLog.id)];
          return updated.slice(0, limit);
        });

        // Increment summary counts
        setSummary(prev => ({
          ...prev,
          total: prev.total + 1,
          starts: newLog.action === "SERVER_START" ? prev.starts + 1 : prev.starts,
          stops: newLog.action === "SERVER_STOP" ? prev.stops + 1 : prev.stops,
          restarts: newLog.action === "SERVER_RESTART" ? prev.restarts + 1 : prev.restarts,
          fileDeletions: newLog.action === "FILE_DELETE" ? prev.fileDeletions + 1 : prev.fileDeletions,
          serverDeletions: newLog.action === "SERVER_DELETE" ? prev.serverDeletions + 1 : prev.serverDeletions
        }));
        setTotalLogs(prev => prev + 1);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [autoRefresh, page, limit, actionFilter, serverFilter, searchQuery]);

  // Auto-polling interval as reliable fallback
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 12000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLogs]);

  const handleClearLogs = async () => {
    setClearing(true);
    try {
      await axios.delete("/api/admin/audit-logs");
      showToast("Audit logs cleared successfully");
      setShowClearModal(false);
      setLogs([]);
      setTotalLogs(0);
      setTotalPages(1);
      setSummary({ total: 0, starts: 0, stops: 0, restarts: 0, fileDeletions: 0, serverDeletions: 0 });
    } catch (err: any) {
      showToast("Failed to clear audit logs", "error");
    } finally {
      setClearing(false);
    }
  };

  const handleExportLogs = () => {
    window.open("/api/admin/audit-logs/export", "_blank");
  };

  // Helper for human-readable relative time
  const formatTimeAgo = (isoString: string) => {
    try {
      const now = new Date();
      const date = new Date(isoString);
      const diffSecs = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSecs < 10) return "Just now";
      if (diffSecs < 60) return `${diffSecs}s ago`;
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch {
      return isoString;
    }
  };

  // Render badge & icon for each audit action
  const renderActionBadge = (action: AuditLog["action"]) => {
    switch (action) {
      case "SERVER_START":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Play size={11} className="fill-emerald-400" />
            <span>Server Start</span>
          </span>
        );
      case "SERVER_STOP":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Square size={11} className="fill-rose-400" />
            <span>Server Stop</span>
          </span>
        );
      case "SERVER_RESTART":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RotateCw size={11} />
            <span>Server Restart</span>
          </span>
        );
      case "FILE_DELETE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
            <Trash2 size={11} />
            <span>File Deletion</span>
          </span>
        );
      case "SERVER_DELETE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-600/15 text-red-400 border border-red-600/30">
            <AlertTriangle size={11} />
            <span>Server Delete</span>
          </span>
        );
      case "BACKUP_DELETE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-500/15 text-slate-300 border border-slate-500/30">
            <Archive size={11} />
            <span>Backup Delete</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-muted text-muted-foreground border border-border">
            <FileText size={11} />
            <span>{action}</span>
          </span>
        );
    }
  };

  if (user?.role !== "admin" && user?.role !== "owner") {
    return (
      <div className="p-8 text-center text-red-500 font-semibold">
        Access Denied. Administrator privilege required.
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3 }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-24"
    >
      {/* Toast Notification */}
      <AnimatePresence>
        {statusMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border ${
              statusMessage.type === "success"
                ? "bg-emerald-600 text-white border-emerald-400/40"
                : "bg-red-600 text-white border-red-400/40"
            }`}
          >
            {statusMessage.type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            <span className="text-sm font-semibold">{statusMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/70 backdrop-blur-xl border border-border-subtle p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-inner">
            <ScrollText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                System Audit Logs
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Admin Exclusive
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Immutable security record tracking critical server operations (start, stop, restart) and file deletions.
            </p>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2.5 self-end md:self-center">
          <button
            onClick={() => fetchLogs()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-muted hover:bg-muted-hover text-foreground border border-border transition-colors disabled:opacity-50"
            title="Refresh Logs"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportLogs}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-muted hover:bg-muted-hover text-foreground border border-border transition-colors"
            title="Export JSON"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setShowClearModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
            title="Clear all logs"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Total Events</span>
            <ScrollText size={16} className="text-indigo-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-foreground">{summary.total}</span>
        </div>

        <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Server Starts</span>
            <Play size={16} className="text-emerald-400 fill-emerald-400/20" />
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-400">{summary.starts}</span>
        </div>

        <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Server Stops</span>
            <Square size={16} className="text-rose-400 fill-rose-400/20" />
          </div>
          <span className="text-2xl font-bold font-mono text-rose-400">{summary.stops}</span>
        </div>

        <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">Server Restarts</span>
            <RotateCw size={16} className="text-amber-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-amber-400">{summary.restarts}</span>
        </div>

        <div className="p-4 rounded-2xl bg-card/60 backdrop-blur-md border border-border-subtle flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-medium">File Deletions</span>
            <Trash2 size={16} className="text-red-400" />
          </div>
          <span className="text-2xl font-bold font-mono text-red-400">{summary.fileDeletions}</span>
        </div>
      </div>

      {/* Filters and Search Bar Container */}
      <div className="p-4 sm:p-5 bg-card/80 backdrop-blur-xl border border-border-subtle rounded-3xl space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by action, server, user, IP, or filename..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 bg-black/40 border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Server Filter Dropdown */}
            <div className="relative">
              <select
                value={serverFilter}
                onChange={e => {
                  setServerFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 bg-black/40 border border-border rounded-xl text-xs sm:text-sm text-foreground focus:outline-none focus:border-indigo-500/60 transition-colors cursor-pointer"
              >
                <option value="ALL">All Servers</option>
                {serverList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Socket Stream Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/30 border border-border text-xs">
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground"}`} />
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className="text-muted-foreground hover:text-foreground font-medium"
              >
                {autoRefresh ? "Live Stream ON" : "Stream Paused"}
              </button>
            </div>
          </div>
        </div>

        {/* Action Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "ALL", label: "All Logs" },
            { id: "SERVER_START", label: "Starts" },
            { id: "SERVER_STOP", label: "Stops" },
            { id: "SERVER_RESTART", label: "Restarts" },
            { id: "FILE_DELETE", label: "File Deletions" },
            { id: "SERVER_DELETE", label: "Server Deletions" },
            { id: "BACKUP_DELETE", label: "Backups" }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setActionFilter(cat.id);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                actionFilter === cat.id
                  ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted-hover border border-border-subtle"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Audit Log Table */}
      <div className="bg-card/80 backdrop-blur-xl border border-border-subtle rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-muted/60 text-muted-foreground border-b border-border-subtle uppercase text-[11px] tracking-wider font-semibold">
              <tr>
                <th className="px-5 py-3.5">Time</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Server</th>
                <th className="px-4 py-3.5">Actor</th>
                <th className="px-4 py-3.5 hidden md:table-cell">IP Address</th>
                <th className="px-5 py-3.5">Details</th>
                <th className="px-4 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="max-w-sm mx-auto flex flex-col items-center">
                      <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mb-3 border border-border-subtle">
                        <ScrollText size={22} />
                      </div>
                      <h3 className="text-base font-bold text-foreground">No audit logs found</h3>
                      <p className="text-xs text-muted-foreground mt-1 mb-4">
                        {searchQuery || actionFilter !== "ALL" || serverFilter !== "ALL"
                          ? "Try resetting your search filters or selecting all actions."
                          : "Server actions (start, stop, restart) and file deletions will automatically record here."}
                      </p>
                      {(searchQuery || actionFilter !== "ALL" || serverFilter !== "ALL") && (
                        <button
                          onClick={() => {
                            setSearchQuery("");
                            setActionFilter("ALL");
                            setServerFilter("ALL");
                            setPage(1);
                          }}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500 text-white"
                        >
                          Reset Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map(log => {
                  const isExpanded = expandedLogId === log.id;
                  const hasMetadata = Boolean(log.metadata?.paths && log.metadata.paths.length > 0);

                  return (
                    <React.Fragment key={log.id}>
                      <tr 
                        className={`hover:bg-muted/40 transition-colors ${
                          isExpanded ? "bg-muted/30" : ""
                        }`}
                      >
                        {/* Time Column */}
                        <td className="px-5 py-3.5 whitespace-nowrap text-muted-foreground font-mono text-xs">
                          <span title={new Date(log.timestamp).toLocaleString()}>
                            {formatTimeAgo(log.timestamp)}
                          </span>
                        </td>

                        {/* Action Column */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {renderActionBadge(log.action)}
                        </td>

                        {/* Server Column */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {log.serverId ? (
                            <Link
                              to={`/servers/${log.serverId}`}
                              className="font-medium text-foreground hover:text-indigo-400 transition-colors flex items-center gap-1.5"
                            >
                              <Server size={13} className="text-muted-foreground" />
                              <span className="truncate max-w-[130px] sm:max-w-[180px]">{log.serverName || log.serverId}</span>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Actor Column */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                              {log.username ? log.username.slice(0, 1).toUpperCase() : "U"}
                            </div>
                            <span className="font-medium text-foreground">{log.username}</span>
                            {log.userRole && (
                              <span className="text-[10px] font-mono text-muted-foreground uppercase opacity-70">
                                ({log.userRole})
                              </span>
                            )}
                          </div>
                        </td>

                        {/* IP Address */}
                        <td className="px-4 py-3.5 whitespace-nowrap hidden md:table-cell text-xs font-mono text-muted-foreground">
                          {log.ip || "127.0.0.1"}
                        </td>

                        {/* Details Column */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-between gap-2 max-w-md">
                            <span className="truncate text-foreground/90 font-medium">
                              {log.details}
                            </span>
                            {hasMetadata && (
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="text-indigo-400 hover:text-indigo-300 text-xs flex items-center gap-0.5 shrink-0 px-2 py-0.5 rounded-md bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                              >
                                <span>{isExpanded ? "Hide" : "Files"}</span>
                                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          {log.status === "success" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                              <CheckCircle2 size={13} />
                              <span className="hidden sm:inline">Success</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
                              <XCircle size={13} />
                              <span className="hidden sm:inline">Failed</span>
                            </span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable row for detailed deleted files */}
                      {isExpanded && hasMetadata && (
                        <tr className="bg-black/20 border-b border-border-subtle">
                          <td colSpan={7} className="px-8 py-3">
                            <div className="p-3 rounded-xl bg-card border border-border-subtle space-y-2">
                              <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                                <Trash2 size={13} className="text-red-400" />
                                <span>Deleted Paths ({log.metadata?.paths?.length || 0}):</span>
                              </div>
                              <div className="max-h-40 overflow-y-auto space-y-1 font-mono text-xs text-muted-foreground no-scrollbar">
                                {log.metadata?.paths?.map((p, idx) => (
                                  <div key={idx} className="flex items-center gap-2 py-0.5 px-2 rounded hover:bg-muted/50">
                                    <span className="text-red-400 select-none">-</span>
                                    <span className="text-foreground/90">{p}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground bg-muted/20">
          <div>
            Showing <span className="font-semibold text-foreground">{logs.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{" "}
            <span className="font-semibold text-foreground">{Math.min(page * limit, totalLogs)}</span> of{" "}
            <span className="font-semibold text-foreground">{totalLogs}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <select
              value={limit}
              onChange={e => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="px-2.5 py-1 bg-black/40 border border-border rounded-lg text-xs text-foreground focus:outline-none"
            >
              <option value="15">15 / page</option>
              <option value="25">25 / page</option>
              <option value="50">50 / page</option>
              <option value="100">100 / page</option>
            </select>

            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg bg-muted hover:bg-muted-hover text-foreground border border-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="font-mono px-2">
              Page {page} of {totalPages}
            </span>

            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg bg-muted hover:bg-muted-hover text-foreground border border-border disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Clearing Logs */}
      <AnimatePresence>
        {showClearModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearModal(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-card border border-border rounded-3xl w-full max-w-md p-6 shadow-2xl z-10 space-y-5"
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Clear Audit Logs?</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    This will permanently purge all recorded audit history.
                  </p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Are you sure you want to proceed? Exporting logs beforehand is recommended if compliance or retention is required.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClearModal(false)}
                  disabled={clearing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-muted hover:bg-muted-hover text-foreground border border-border transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearLogs}
                  disabled={clearing}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30 transition-colors disabled:opacity-50"
                >
                  {clearing ? "Purging..." : "Yes, Clear Logs"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
