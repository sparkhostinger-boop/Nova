import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  Archive, Download, UploadCloud, CheckCircle2, AlertTriangle, 
  RefreshCw, Server, HardDrive, FileArchive, Check, AlertCircle, 
  X, ShieldAlert, Database, FolderArchive, Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";

interface BackupInfo {
  serversCount: number;
  usersCount: number;
  nodesCount: number;
  estimatedSizeBytes: number;
  estimatedSizeFormatted: string;
}

interface ServerStat {
  id: string;
  name: string;
  software: string;
  version: string;
  port: number;
  status: string;
  memory: number;
  totalSizeBytes: number;
  totalSizeFormatted: string;
  worldSizeBytes: number;
  worldSizeFormatted: string;
  pluginCount: number;
  modCount: number;
  playerDataCount: number;
  backupsCount: number;
}

interface StoredBackup {
  id: string;
  serverId: string;
  serverName: string;
  filename: string;
  size: number;
  sizeFormatted: string;
  createdAt: string;
}

export default function AdminBackups() {
  const [activeTab, setActiveTab] = useState<"cluster" | "history">("cluster");
  const [backupInfo, setBackupInfo] = useState<BackupInfo | null>(null);
  const [serverStats, setServerStats] = useState<ServerStat[]>([]);
  const [storedBackups, setStoredBackups] = useState<StoredBackup[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Full panel export/restore states
  const [isDownloadingCluster, setIsDownloadingCluster] = useState(false);
  const [clusterFile, setClusterFile] = useState<File | null>(null);
  const [isRestoringCluster, setIsRestoringCluster] = useState(false);
  const [showClusterModal, setShowClusterModal] = useState(false);
  const [clusterResult, setClusterResult] = useState<{ success: boolean; message: string; stats?: any } | null>(null);

  // General error & toasts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const clusterFileInputRef = useRef<HTMLInputElement>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [infoRes, statsRes] = await Promise.allSettled([
        axios.get("/api/system/backup/info"),
        axios.get("/api/system/backup/servers/stats")
      ]);

      if (infoRes.status === "fulfilled") {
        setBackupInfo(infoRes.value.data);
      }
      
      let currentStats: ServerStat[] = [];
      if (statsRes.status === "fulfilled") {
        currentStats = Array.isArray(statsRes.value.data) ? statsRes.value.data : [];
        setServerStats(currentStats);
      }

      // Collect all stored backups from servers
      const allBackups: StoredBackup[] = [];
      for (const s of currentStats) {
        try {
          const bRes = await axios.get(`/api/servers/${s.id}/backups`);
          if (Array.isArray(bRes.data)) {
            bRes.data.forEach((b: any) => {
              allBackups.push({
                id: `${s.id}-${b.filename}`,
                serverId: s.id,
                serverName: s.name,
                filename: b.filename,
                size: b.size,
                sizeFormatted: (b.size / (1024 * 1024)).toFixed(2) + " MB",
                createdAt: b.createdAt
              });
            });
          }
        } catch (e) {}
      }
      setStoredBackups(allBackups);

      if (infoRes.status === "rejected" && statsRes.status === "rejected") {
        const errorMsg = (infoRes as any).reason?.response?.data?.error || "Failed to load backup data";
        setErrorMessage(errorMsg);
      }
    } catch (err: any) {
      console.error("Failed to load backup dashboard data:", err);
      setErrorMessage(err.response?.data?.error || "Failed to load backup data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchAllData();
    }
  }, [authLoading, user]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Download entire panel
  const handleDownloadCluster = async () => {
    setIsDownloadingCluster(true);
    setErrorMessage(null);
    try {
      const response = await axios.get("/api/system/backup/download", {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      const contentDisposition = response.headers["content-disposition"];
      let filename = `sh-panel-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        if (match && match[1]) filename = match[1];
      }

      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast("FULL PANEL backup archive downloaded successfully!");
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || "Failed to download FULL PANEL backup archive.");
    } finally {
      setIsDownloadingCluster(false);
    }
  };

  // Restore entire panel
  const handleRestoreCluster = async () => {
    if (!clusterFile) return;
    setShowClusterModal(false);
    setIsRestoringCluster(true);
    setErrorMessage(null);
    setClusterResult(null);

    try {
      const CHUNK_SIZE = 512 * 1024; // 512KB chunks
      const totalChunks = Math.ceil(clusterFile.size / CHUNK_SIZE);
      const fileId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, clusterFile.size);
        const chunk = clusterFile.slice(start, end);
        
        const chunkData = new FormData();
        chunkData.append("chunk", chunk);
        chunkData.append("fileId", fileId);
        chunkData.append("chunkIndex", i.toString());
        chunkData.append("totalChunks", totalChunks.toString());
        
        await axios.post("/api/system/backup/restore-chunk", chunkData);
      }

      const res = await axios.post("/api/system/backup/restore-process", { fileId, originalName: clusterFile.name });

      setClusterResult({
        success: true,
        message: res.data.message || "FULL PANEL backup restored successfully!",
        stats: res.data.stats
      });
      setClusterFile(null);
      if (clusterFileInputRef.current) clusterFileInputRef.current.value = "";
      fetchAllData();
      showToast("FULL PANEL restored successfully!");
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || "Failed to restore FULL PANEL backup archive.");
    } finally {
      setIsRestoringCluster(false);
    }
  };

  // Delete a stored backup
  const handleDeleteStoredBackup = async (b: StoredBackup) => {
    try {
      await axios.delete(`/api/servers/${b.serverId}/backups/${b.filename}`);
      setStoredBackups(prev => prev.filter(x => x.id !== b.id));
      showToast(`Deleted backup ${b.filename}`);
      fetchAllData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || "Failed to delete backup");
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {successToast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-600 text-white rounded-2xl shadow-2xl border border-emerald-400/30"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-semibold">{successToast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/60 backdrop-blur-xl border border-border-subtle p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-inner">
            <Archive className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
              Admin Backups & Disaster Recovery
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Generate full snapshots of your panel, download complete disaster recovery ZIP files, and restore anytime.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            type="button"
            onClick={fetchAllData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-foreground bg-muted hover:bg-muted-hover rounded-xl border border-border transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Badges */}
      {backupInfo && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-2xl bg-card border border-border-subtle flex items-center gap-3.5 shadow-sm">
            <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Server size={20} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">Total Servers</span>
              <span className="text-base font-bold text-foreground font-mono">{backupInfo.serversCount} Active</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border-subtle flex items-center gap-3.5 shadow-sm">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <HardDrive size={20} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">Total Panel Size</span>
              <span className="text-base font-bold text-foreground font-mono">{backupInfo.estimatedSizeFormatted}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border-subtle flex items-center gap-3.5 shadow-sm">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FolderArchive size={20} />
            </div>
            <div>
              <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block">Local Archives</span>
              <span className="text-base font-bold text-foreground font-mono">{storedBackups.length} Stored</span>
            </div>
          </div>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-red-500/20 rounded-lg text-red-300">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab("cluster")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "cluster"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Database size={16} />
          <span>FULL PANEL</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === "history"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <FileArchive size={16} />
          <span>Saved Archives</span>
          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
            {storedBackups.length}
          </span>
        </button>
      </div>

      {/* TAB 1: FULL PANEL */}
      {activeTab === "cluster" && (
        <div className="space-y-6">
          {/* Success banner */}
          {clusterResult && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={24} className="shrink-0 text-emerald-400" />
                <div>
                  <p className="font-bold text-foreground text-base">{clusterResult.message}</p>
                  {clusterResult.stats && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                      Restored {clusterResult.stats.serversRestored} server instances and {clusterResult.stats.usersRestored} user profiles.
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-bold bg-emerald-500 text-zinc-950 rounded-xl hover:bg-emerald-400 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
              >
                Reload Panel
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Download Card */}
            <div className="bg-card border border-border-subtle rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Download FULL PANEL Backup</h2>
                    <p className="text-xs text-muted-foreground">Complete snapshot archive of all panel assets & servers</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Generates an integrated <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">.zip</code> archive containing all server directories, active plugins, player profiles & data, Minecraft world regions, configuration files, and system databases.
                </p>

                <div className="p-4 rounded-2xl bg-muted/40 border border-border-subtle space-y-2.5">
                  <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-wider block font-semibold">
                    Included Components
                  </span>
                  <ul className="text-xs text-muted-foreground space-y-1.5 font-mono">
                    <li className="flex items-center gap-2 text-foreground/90">
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      <span>All Server Worlds, Dimensions & Regions</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground/90">
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      <span>Plugins (.jar files, configs & SQLite databases)</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground/90">
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      <span>Player Data (inventories, stats, advancements, UUIDs)</span>
                    </li>
                    <li className="flex items-center gap-2 text-foreground/90">
                      <Check size={14} className="text-emerald-400 shrink-0" />
                      <span>Panel Users, Roles, API Keys, SFTP & Nodes</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <button
                  type="button"
                  disabled={isDownloadingCluster}
                  onClick={handleDownloadCluster}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isDownloadingCluster ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating FULL PANEL Backup ZIP...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>Download FULL PANEL Backup (.zip)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Restore Card */}
            <div className="bg-card border border-border-subtle rounded-3xl p-6 flex flex-col justify-between space-y-6 shadow-xl relative overflow-hidden">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-2xl border border-emerald-500/20">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-foreground">Restore FULL PANEL Archive</h2>
                    <p className="text-xs text-muted-foreground">Restore from existing .zip FULL PANEL backup</p>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Upload an exported FULL PANEL backup archive to restore servers, configurations, users, and plugin settings.
                </p>

                {/* Dropzone */}
                <input
                  type="file"
                  ref={clusterFileInputRef}
                  accept=".zip,application/zip,application/x-zip-compressed"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      if (!f.name.endsWith(".zip")) {
                        setErrorMessage("Please select a valid .zip backup file.");
                        return;
                      }
                      setClusterFile(f);
                      setErrorMessage(null);
                    }
                  }}
                  className="hidden"
                />

                <div
                  onClick={() => clusterFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2.5 ${
                    clusterFile 
                      ? "border-emerald-500/60 bg-emerald-500/5" 
                      : "border-border hover:border-muted-foreground/40 bg-muted/20 hover:bg-muted/40"
                  }`}
                >
                  {clusterFile ? (
                    <div className="flex items-center gap-3 text-left w-full px-2">
                      <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20 shrink-0">
                        <FileArchive size={24} />
                      </div>
                      <div className="truncate flex-1">
                        <p className="text-sm font-bold text-foreground truncate">{clusterFile.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{(clusterFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setClusterFile(null);
                          if (clusterFileInputRef.current) clusterFileInputRef.current.value = "";
                        }}
                        className="p-2 text-muted-foreground hover:text-red-400 rounded-xl transition-colors cursor-pointer"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <UploadCloud className="w-8 h-8 text-muted-foreground/60" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Click to upload or drag & drop</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Compatible with FULL PANEL backup archives (.zip)</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div>
                <button
                  type="button"
                  disabled={!clusterFile || isRestoringCluster}
                  onClick={() => setShowClusterModal(true)}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isRestoringCluster ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Restoring FULL PANEL Database & Files...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Restore FULL PANEL Backup</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STORED ARCHIVES */}
      {activeTab === "history" && (
        <div className="bg-card border border-border-subtle rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
            <div>
              <h2 className="text-lg font-bold text-foreground">Saved Backup Archives</h2>
              <p className="text-xs text-muted-foreground">Snapshot archives stored on local panel disk storage</p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              {storedBackups.length} archives available
            </span>
          </div>

          {storedBackups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase font-mono text-muted-foreground">
                    <th className="py-3 px-4 font-semibold">Archive File</th>
                    <th className="py-3 px-4 font-semibold">Server</th>
                    <th className="py-3 px-4 font-semibold">Size</th>
                    <th className="py-3 px-4 font-semibold">Created At</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle font-mono text-xs">
                  {storedBackups.map(b => (
                    <tr key={b.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-foreground flex items-center gap-2">
                        <FileArchive className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-xs">{b.filename}</span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <span className="bg-muted px-2 py-0.5 rounded text-foreground font-semibold">
                          {b.serverName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground">{b.sizeFormatted}</td>
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {new Date(b.createdAt).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`/api/servers/${b.serverId}/backups/${b.filename}/download`}
                            download
                            className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors"
                            title="Download ZIP"
                          >
                            <Download size={14} />
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteStoredBackup(b)}
                            className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
                            title="Delete Archive"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center border-2 border-dashed border-border rounded-2xl">
              <FileArchive className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-foreground font-semibold">No saved backup archives found</p>
              <p className="text-xs text-muted-foreground mt-1">
                You can generate backups from the FULL PANEL tab or directly in any Server Console &rarr; Backups view.
              </p>
            </div>
          )}
        </div>
      )}

      {/* FULL PANEL RESTORE CONFIRMATION MODAL */}
      <AnimatePresence>
        {showClusterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-amber-400">
                <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                  <ShieldAlert className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Restore FULL PANEL</h3>
                  <p className="text-xs text-muted-foreground">Disaster Recovery Action</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-2 leading-relaxed bg-muted/40 p-4 rounded-2xl border border-border">
                <p>
                  You are about to restore the FULL PANEL backup archive: <strong className="text-foreground font-mono block mt-1">{clusterFile?.name}</strong>
                </p>
                <p className="text-amber-300 font-semibold pt-1">
                  ⚠️ This action will restore all server directories, active plugins, player profiles, and databases from the archive. Your current administrative login session will be preserved.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClusterModal(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted-hover border border-border transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRestoreCluster}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  Confirm & Restore FULL PANEL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
