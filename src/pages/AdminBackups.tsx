import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  Archive, Download, UploadCloud, CheckCircle2, AlertTriangle, 
  RefreshCw, Server, HardDrive, FileArchive, Check, AlertCircle, 
  X, ShieldAlert, Database, FolderArchive, Trash2, ExternalLink,
  LogOut, Cloud, Upload, Settings, Copy, Globe, Key
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { 
  connectGoogleDrive, 
  disconnectGoogleDrive, 
  initDriveAuth, 
  listGoogleDriveBackups, 
  uploadBackupToGoogleDrive, 
  deleteGoogleDriveBackup, 
  downloadGoogleDriveBackup, 
  DriveUser, 
  DriveBackupFile,
  getDriveAccessToken
} from "../lib/googleDrive";

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
  const [activeTab, setActiveTab] = useState<"cluster" | "history" | "cloud">("cluster");
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
  const [restoreProgress, setRestoreProgress] = useState<{ current: number; total: number; stage: string } | null>(null);

  // General error & toasts
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const { googleClientId, fetchSettings } = useSettings();
  const clusterFileInputRef = useRef<HTMLInputElement>(null);

  // Google Drive Cloud states
  const [driveUser, setDriveUser] = useState<DriveUser | null>(null);
  const [hasDriveToken, setHasDriveToken] = useState(false);
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [driveBackups, setDriveBackups] = useState<DriveBackupFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [isUploadingToDrive, setIsUploadingToDrive] = useState(false);
  const [driveUploadProgress, setDriveUploadProgress] = useState<number>(0);
  const [driveUploadStatus, setDriveUploadStatus] = useState<string>("");
  const [driveDeleteTarget, setDriveDeleteTarget] = useState<DriveBackupFile | null>(null);
  const [isDeletingDriveFile, setIsDeletingDriveFile] = useState(false);
  const [driveCustomFile, setDriveCustomFile] = useState<File | null>(null);
  const driveFileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingBackupId, setUploadingBackupId] = useState<string | null>(null);

  // Custom Google OAuth Client ID Modal states
  const [showOAuthConfigModal, setShowOAuthConfigModal] = useState(false);
  const [customIdInput, setCustomIdInput] = useState(googleClientId || "");
  const [isSavingCustomId, setIsSavingCustomId] = useState(false);
  const [copiedOrigin, setCopiedOrigin] = useState(false);

  useEffect(() => {
    if (googleClientId !== undefined) {
      setCustomIdInput(googleClientId || "");
    }
  }, [googleClientId]);

  // Initialize Drive Auth listener
  useEffect(() => {
    const unsubscribe = initDriveAuth((authUser, tokenPresent) => {
      setDriveUser(authUser);
      setHasDriveToken(tokenPresent);
      if (tokenPresent) {
        fetchDriveFiles();
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const fetchDriveFiles = async () => {
    if (!getDriveAccessToken()) return;
    setIsLoadingDrive(true);
    try {
      const files = await listGoogleDriveBackups();
      setDriveBackups(files);
    } catch (err: any) {
      console.error("Failed to list Google Drive files:", err);
      if (err.message?.includes("expired")) {
        setHasDriveToken(false);
        setDriveUser(null);
        showToast("Google Drive session expired. Please reconnect.");
      }
    } finally {
      setIsLoadingDrive(false);
    }
  };

  const handleConnectDrive = async () => {
    setIsConnectingDrive(true);
    setErrorMessage(null);
    try {
      const result = await connectGoogleDrive(googleClientId);
      setDriveUser(result.user);
      setHasDriveToken(true);
      showToast(`Connected Google Drive as ${result.user.email || result.user.displayName || "Google Account"}`);
      setIsLoadingDrive(true);
      const files = await listGoogleDriveBackups();
      setDriveBackups(files);
    } catch (err: any) {
      const isCancelled =
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request";

      if (!isCancelled) {
        console.error("Google Drive connection error:", err);
        setErrorMessage(err?.message || "Failed to authenticate with Google Drive.");
      } else {
        showToast("Google sign-in window was closed.");
      }
    } finally {
      setIsConnectingDrive(false);
      setIsLoadingDrive(false);
    }
  };

  const handleSaveOAuthClientId = async () => {
    setIsSavingCustomId(true);
    try {
      await axios.put("/api/system/settings", {
        googleClientId: customIdInput.trim()
      });
      await fetchSettings();
      setShowOAuthConfigModal(false);
      showToast(customIdInput.trim() ? "Custom Google Client ID saved successfully!" : "Default Google OAuth restored.");
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || "Failed to save Google Client ID.");
    } finally {
      setIsSavingCustomId(false);
    }
  };

  const handleClearOAuthClientId = async () => {
    setIsSavingCustomId(true);
    try {
      await axios.put("/api/system/settings", {
        googleClientId: ""
      });
      setCustomIdInput("");
      await fetchSettings();
      setShowOAuthConfigModal(false);
      showToast("Reset to default Google OAuth.");
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.error || "Failed to reset Google Client ID.");
    } finally {
      setIsSavingCustomId(false);
    }
  };

  const handleDisconnectDrive = async () => {
    try {
      await disconnectGoogleDrive();
      setDriveUser(null);
      setHasDriveToken(false);
      setDriveBackups([]);
      showToast("Google Drive disconnected.");
    } catch (err: any) {
      setErrorMessage("Failed to disconnect Google Drive.");
    }
  };

  const handleUploadFullPanelToDrive = async () => {
    if (!hasDriveToken) {
      setErrorMessage("Please connect Google Drive first.");
      return;
    }

    setIsUploadingToDrive(true);
    setDriveUploadProgress(0);
    setDriveUploadStatus("Preparing full panel archive...");
    setErrorMessage(null);

    try {
      const response = await axios.get("/api/system/backup/download", {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setDriveUploadStatus(`Downloading cluster bundle (${pct}%)...`);
          }
        }
      });

      const blob = new Blob([response.data], { type: "application/zip" });
      const now = new Date();
      const filename = `nova-panel-full-backup-${now.toISOString().slice(0, 19).replace(/[:.]/g, "-")}.zip`;

      setDriveUploadStatus("Uploading to your Google Drive...");
      await uploadBackupToGoogleDrive(blob, filename, (pct) => {
        setDriveUploadProgress(pct);
        setDriveUploadStatus(`Uploading to Google Drive: ${pct}%`);
      });

      showToast(`Full panel backup saved to Google Drive! (${filename})`);
      fetchDriveFiles();
    } catch (err: any) {
      console.error("Upload full panel to Google Drive error:", err);
      setErrorMessage(err.message || "Failed to upload full panel backup to Google Drive.");
    } finally {
      setIsUploadingToDrive(false);
      setDriveUploadProgress(0);
      setDriveUploadStatus("");
    }
  };

  const handleUploadStoredBackupToDrive = async (b: StoredBackup) => {
    if (!hasDriveToken) {
      try {
        const authRes = await connectGoogleDrive(googleClientId);
        setDriveUser(authRes.user);
        setHasDriveToken(true);
      } catch (e: any) {
        const isCancelled =
          e?.code === "auth/popup-closed-by-user" ||
          e?.code === "auth/cancelled-popup-request";
        if (!isCancelled) {
          console.error("Google Drive connection error:", e);
          setErrorMessage("Please connect Google Drive to upload backups.");
        }
        return;
      }
    }

    setUploadingBackupId(b.id);
    try {
      const response = await axios.get(`/api/servers/${b.serverId}/backups/${b.filename}`, {
        responseType: "blob"
      });
      const blob = new Blob([response.data], { type: "application/zip" });
      await uploadBackupToGoogleDrive(blob, b.filename);
      showToast(`Uploaded ${b.filename} to Google Drive!`);
      fetchDriveFiles();
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to upload ${b.filename} to Google Drive`);
    } finally {
      setUploadingBackupId(null);
    }
  };

  const handleUploadCustomFileToDrive = async () => {
    if (!driveCustomFile) return;
    if (!hasDriveToken) {
      setErrorMessage("Please connect your Google Drive account first.");
      return;
    }

    setIsUploadingToDrive(true);
    setDriveUploadProgress(0);
    setDriveUploadStatus(`Uploading ${driveCustomFile.name} to Google Drive...`);

    try {
      await uploadBackupToGoogleDrive(driveCustomFile, driveCustomFile.name, (pct) => {
        setDriveUploadProgress(pct);
        setDriveUploadStatus(`Uploading ${driveCustomFile.name}: ${pct}%`);
      });

      showToast(`Uploaded ${driveCustomFile.name} to Google Drive!`);
      setDriveCustomFile(null);
      if (driveFileInputRef.current) driveFileInputRef.current.value = "";
      fetchDriveFiles();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload backup to Google Drive.");
    } finally {
      setIsUploadingToDrive(false);
      setDriveUploadProgress(0);
      setDriveUploadStatus("");
    }
  };

  const handleConfirmDeleteDriveFile = async () => {
    if (!driveDeleteTarget) return;
    setIsDeletingDriveFile(true);
    try {
      await deleteGoogleDriveBackup(driveDeleteTarget.id);
      showToast(`Deleted ${driveDeleteTarget.name} from Google Drive`);
      setDriveDeleteTarget(null);
      fetchDriveFiles();
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete backup from Google Drive.");
    } finally {
      setIsDeletingDriveFile(false);
    }
  };

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
      let filename = `nova-panel-backup-${new Date().toISOString().slice(0, 10)}.zip`;
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
      const CHUNK_SIZE = 2 * 1024 * 1024; // 2MB chunks for faster upload
      const totalChunks = Math.ceil(clusterFile.size / CHUNK_SIZE);
      const fileId = Date.now().toString() + Math.floor(Math.random() * 1000).toString();

      setRestoreProgress({ current: 0, total: totalChunks, stage: "uploading" });

      // Process in batches of 4 concurrent uploads to maximize speed
      const BATCH_SIZE = 4;
      let completedChunks = 0;

      for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
        const batch = [];
        for (let j = 0; j < BATCH_SIZE && i + j < totalChunks; j++) {
          const chunkIndex = i + j;
          const start = chunkIndex * CHUNK_SIZE;
          const end = Math.min(start + CHUNK_SIZE, clusterFile.size);
          const chunk = clusterFile.slice(start, end);
          
          const chunkData = new FormData();
          chunkData.append("chunk", chunk);
          chunkData.append("fileId", fileId);
          chunkData.append("chunkIndex", chunkIndex.toString());
          chunkData.append("totalChunks", totalChunks.toString());
          
          batch.push(axios.post("/api/system/backup/restore-chunk", chunkData).then(() => {
            completedChunks++;
            setRestoreProgress({ current: completedChunks, total: totalChunks, stage: "uploading" });
          }));
        }
        await Promise.all(batch);
      }

      setRestoreProgress({ current: totalChunks, total: totalChunks, stage: "processing" });
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
        
        <button
          onClick={() => setActiveTab("cloud" as any)}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer whitespace-nowrap ${
            activeTab === ("cloud" as any)
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <UploadCloud size={16} />
          <span>Cloud (Google Drive)</span>
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
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white shadow-xl shadow-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed relative overflow-hidden"
                >
                  {isRestoringCluster && restoreProgress && restoreProgress.stage === "uploading" && (
                    <div 
                      className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-300 ease-out" 
                      style={{ width: `${(restoreProgress.current / restoreProgress.total) * 100}%` }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2.5">
                    {isRestoringCluster ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>
                          {restoreProgress 
                            ? (restoreProgress.stage === "uploading" 
                                ? `Uploading... ${Math.round((restoreProgress.current / restoreProgress.total) * 100)}%` 
                                : "Processing Backup & Files...") 
                            : "Restoring FULL PANEL Database & Files..."}
                        </span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>Restore FULL PANEL Backup</span>
                      </>
                    )}
                  </div>
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
                          <button
                            type="button"
                            disabled={uploadingBackupId === b.id}
                            onClick={() => handleUploadStoredBackupToDrive(b)}
                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors cursor-pointer disabled:opacity-50"
                            title="Upload Archive to Google Drive"
                          >
                            {uploadingBackupId === b.id ? (
                              <RefreshCw size={14} className="animate-spin" />
                            ) : (
                              <UploadCloud size={14} />
                            )}
                          </button>
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

      {/* TAB 3: CLOUD (Google Drive Direct OAuth) */}
      {activeTab === "cloud" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card border border-border-subtle shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <UploadCloud size={20} className="text-indigo-400" />
                  Google Drive Cloud Backups
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Authenticate directly with Google OAuth to upload and download server and full cluster backups. No manual API keys or service account JSON required.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setShowOAuthConfigModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-300 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                >
                  <Settings size={13} className="text-amber-400" />
                  <span>OAuth Settings</span>
                  {googleClientId && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" title="Custom Client ID Active" />
                  )}
                </button>

                {hasDriveToken && driveUser && (
                  <button
                    type="button"
                    onClick={handleDisconnectDrive}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-400 bg-zinc-900 border border-zinc-800 hover:border-red-500/30 transition-colors cursor-pointer"
                  >
                    <LogOut size={13} />
                    <span>Disconnect Drive</span>
                  </button>
                )}
              </div>
            </div>

            {/* OAUTH AUTHENTICATION SECTION */}
            {!hasDriveToken || !driveUser ? (
              <div className="bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-indigo-950/20 border border-zinc-800/80 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
                <div className="flex items-start gap-4 max-w-xl">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
                    <svg width="28" height="28" viewBox="0 0 24 24">
                      <path d="M15.3976 11.0543L11.5173 4.33129H3.75734L7.63765 11.0543H15.3976Z" fill="#34A853"/>
                      <path d="M15.3976 11.0543H7.63765L3.75734 17.7774H11.5173L15.3976 11.0543Z" fill="#FBBC04"/>
                      <path d="M11.5173 4.33129L19.2772 17.7774H11.5173L3.75734 4.33129H11.5173Z" fill="#4285F4"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-base font-bold text-white">
                        Direct Google Drive Integration
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                        OAuth 2.0
                      </span>
                      {googleClientId ? (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <Check size={11} /> VPS Custom Client ID
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                          Default Client
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Connect directly using your Google account. Backups will be securely stored in your personal Google Drive storage using direct resumable uploads.
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check size={13} /> No API Keys Needed
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check size={13} /> In-Memory Token Security
                      </span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check size={13} /> Multi-Admin VPS Ready
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 w-full md:w-auto flex flex-col items-center md:items-end gap-2.5">
                  <button
                    type="button"
                    onClick={handleConnectDrive}
                    disabled={isConnectingDrive}
                    className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3.5 bg-white hover:bg-zinc-100 active:scale-98 text-zinc-900 font-bold text-sm rounded-xl transition-all shadow-lg hover:shadow-white/10 disabled:opacity-60 cursor-pointer"
                  >
                    {isConnectingDrive ? (
                      <>
                        <RefreshCw size={16} className="animate-spin text-zinc-700" />
                        <span>Connecting Google Drive...</span>
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24">
                          <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"/>
                          <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"/>
                          <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"/>
                          <path fill="#34A853" d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 22.3 12 23z"/>
                        </svg>
                        <span>Sign in with Google</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOAuthConfigModal(true)}
                    className="text-xs text-indigo-300 hover:text-indigo-200 flex items-center gap-1.5 underline underline-offset-4 decoration-indigo-500/40 hover:decoration-indigo-400 cursor-pointer"
                  >
                    <Key size={13} />
                    <span>{googleClientId ? "Change Custom Client ID" : "Configure Custom Client ID for VPS"}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* CONNECTED ACCOUNT BANNER */
              <div className="bg-zinc-900/60 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {driveUser.photoURL ? (
                    <img 
                      src={driveUser.photoURL} 
                      alt={driveUser.displayName || "Google User"} 
                      className="w-11 h-11 rounded-full border border-emerald-500/40 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
                      {driveUser.displayName?.[0] || driveUser.email?.[0] || "G"}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">
                        {driveUser.displayName || "Connected Account"}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 size={12} /> Google Drive Active
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {driveUser.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={fetchDriveFiles}
                    disabled={isLoadingDrive}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 transition-colors cursor-pointer"
                  >
                    <RefreshCw size={13} className={isLoadingDrive ? "animate-spin" : ""} />
                    <span>Refresh Drive Files</span>
                  </button>
                </div>
              </div>
            )}

            {/* UPLOAD PROGRESS BAR */}
            {isUploadingToDrive && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-300 flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin text-indigo-400" />
                    {driveUploadStatus || "Uploading to Google Drive..."}
                  </span>
                  <span className="font-mono font-bold text-indigo-200">
                    {driveUploadProgress}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.max(5, driveUploadProgress)}%` }}
                  />
                </div>
              </motion.div>
            )}

            {/* ACTION PANELS */}
            {hasDriveToken && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Panel 1: Full Panel Backup to Google Drive */}
                <div className="p-5 rounded-2xl bg-zinc-900/40 border border-border-subtle flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                        <Cloud size={18} />
                      </div>
                      <h4 className="font-bold text-sm text-foreground">Backup Full Panel to Google Drive</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Packages all server directories, databases, panel user accounts, and configurations into a compressed archive and streams directly into your Google Drive.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isUploadingToDrive}
                    onClick={handleUploadFullPanelToDrive}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-98 disabled:opacity-50 cursor-pointer"
                  >
                    {isUploadingToDrive ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Uploading Archive...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={14} />
                        <span>Take Full Panel Backup to Drive</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Panel 2: Upload Existing Archive to Drive */}
                <div className="p-5 rounded-2xl bg-zinc-900/40 border border-border-subtle flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Upload size={18} />
                      </div>
                      <h4 className="font-bold text-sm text-foreground">Upload Local Backup (.zip)</h4>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Select a server backup ZIP from your computer to store in your Google Drive cloud archive.
                    </p>
                  </div>

                  <div>
                    <input
                      type="file"
                      ref={driveFileInputRef}
                      accept=".zip,application/zip"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setDriveCustomFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {driveCustomFile ? (
                      <div className="flex items-center justify-between gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded-xl mb-2">
                        <span className="text-xs font-mono text-zinc-300 truncate">{driveCustomFile.name}</span>
                        <button
                          type="button"
                          onClick={handleUploadCustomFileToDrive}
                          disabled={isUploadingToDrive}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          Upload
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => driveFileInputRef.current?.click()}
                        disabled={isUploadingToDrive}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-foreground border border-zinc-700/60 transition-all cursor-pointer"
                      >
                        <Upload size={14} />
                        <span>Select .ZIP File to Upload</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* GOOGLE DRIVE STORED BACKUPS LIST */}
            {hasDriveToken && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <FileArchive size={16} className="text-indigo-400" />
                    Backups in Your Google Drive
                    <span className="text-xs font-mono bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full">
                      {driveBackups.length}
                    </span>
                  </h4>

                  <button
                    type="button"
                    onClick={fetchDriveFiles}
                    disabled={isLoadingDrive}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <RefreshCw size={12} className={isLoadingDrive ? "animate-spin" : ""} />
                    Refresh
                  </button>
                </div>

                {isLoadingDrive ? (
                  <div className="p-8 text-center bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                    <RefreshCw size={20} className="animate-spin text-indigo-400 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Scanning Google Drive backups...</p>
                  </div>
                ) : driveBackups.length > 0 ? (
                  <div className="overflow-x-auto border border-border-subtle rounded-2xl bg-zinc-950/50">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border-subtle text-xs uppercase font-mono text-muted-foreground bg-zinc-900/40">
                          <th className="py-3 px-4 font-semibold">Backup File</th>
                          <th className="py-3 px-4 font-semibold">Size</th>
                          <th className="py-3 px-4 font-semibold">Uploaded</th>
                          <th className="py-3 px-4 font-semibold text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/60 font-mono text-xs">
                        {driveBackups.map(file => (
                          <tr key={file.id} className="hover:bg-zinc-900/40 transition-colors">
                            <td className="py-3 px-4 font-medium text-foreground flex items-center gap-2.5">
                              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                                <FileArchive size={15} />
                              </div>
                              <span className="truncate max-w-xs sm:max-w-md">{file.name}</span>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                              {file.size}
                            </td>
                            <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                              {new Date(file.createdTime).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2">
                                {file.webViewLink && (
                                  <a
                                    href={file.webViewLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                                    title="Open in Google Drive"
                                  >
                                    <ExternalLink size={14} />
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => downloadGoogleDriveBackup(file.id, file.name)}
                                  className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/20 transition-colors cursor-pointer"
                                  title="Download from Google Drive"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDriveDeleteTarget(file)}
                                  className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors cursor-pointer"
                                  title="Delete from Google Drive"
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
                  <div className="p-8 text-center bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
                    <Cloud size={24} className="text-zinc-600 mx-auto mb-2" />
                    <p className="text-xs font-semibold text-foreground">No Google Drive backups found</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Take a full panel backup or upload a server backup archive above.
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {/* BACKUP SCHEDULE SETTINGS */}
            <div className="mt-6 border-t border-border-subtle pt-6">
              <h4 className="text-sm font-bold text-foreground mb-4">Cloud Backup Schedule</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
                   <div className="text-xs text-zinc-400 mb-2">Automated Cloud Sync Frequency</div>
                   <div className="flex items-center gap-2">
                     <span className="text-sm font-semibold text-zinc-300">Every</span>
                     <input 
                       type="number" 
                       min="1" 
                       defaultValue="12" 
                       className="w-16 bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm text-white outline-none text-center"
                     />
                     <select defaultValue="hours" className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg p-2 text-sm text-white outline-none">
                       <option value="hours">Hours</option>
                       <option value="days">Days</option>
                       <option value="weeks">Weeks</option>
                     </select>
                   </div>
                </div>
                
                <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl flex items-center justify-between">
                   <div>
                     <div className="text-xs text-zinc-400 mb-1">Status</div>
                     <div className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                       <CheckCircle2 size={14} /> 
                       {hasDriveToken ? "OAuth Connected & Ready" : "Awaiting Google Drive Sign-In"}
                     </div>
                   </div>
                   <button 
                     type="button"
                     onClick={hasDriveToken ? handleUploadFullPanelToDrive : handleConnectDrive}
                     disabled={isUploadingToDrive}
                     className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                   >
                     {hasDriveToken ? "Run Cloud Backup Now" : "Connect Drive"}
                   </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GOOGLE DRIVE FILE DELETION CONFIRMATION MODAL */}
      <AnimatePresence>
        {driveDeleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Delete from Google Drive</h3>
                  <p className="text-xs text-muted-foreground">Permanent Cloud Deletion</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-2 leading-relaxed bg-muted/40 p-4 rounded-2xl border border-border">
                <p>
                  Are you sure you want to permanently delete this backup from your Google Drive?
                </p>
                <p className="font-mono text-foreground font-semibold bg-zinc-950 p-2 rounded-lg break-all">
                  {driveDeleteTarget.name}
                </p>
                <p className="text-red-300 font-semibold pt-1">
                  ⚠️ This file will be deleted from your Google Drive storage and cannot be recovered.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDriveDeleteTarget(null)}
                  disabled={isDeletingDriveFile}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted-hover border border-border transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteDriveFile}
                  disabled={isDeletingDriveFile}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-500 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeletingDriveFile ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* CUSTOM GOOGLE OAUTH CONFIGURATION MODAL */}
        {showOAuthConfigModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 sm:p-7 max-w-xl w-full shadow-2xl space-y-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <Key size={20} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Custom Google OAuth Client ID
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Configure your VPS domain/IP so you and other admins can use personal Google Drive accounts.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowOAuthConfigModal(false)}
                  className="p-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* VPS Origin Display */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                    <Globe size={13} className="text-indigo-400" />
                    VPS Authorized Origin:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        navigator.clipboard.writeText(window.location.origin);
                        setCopiedOrigin(true);
                        setTimeout(() => setCopiedOrigin(false), 2000);
                      }
                    }}
                    className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    {copiedOrigin ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy Origin</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="font-mono text-xs bg-zinc-950 px-3 py-2 rounded-xl text-zinc-300 border border-zinc-800/80 select-all">
                  {typeof window !== "undefined" ? window.location.origin : "http://your-vps:3000"}
                </div>
                <p className="text-[11px] text-zinc-500">
                  Add this exact URL into Google Cloud Console under <strong>Authorized JavaScript origins</strong>.
                </p>
              </div>

              {/* Client ID Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Google Client ID (.apps.googleusercontent.com)
                </label>
                <input
                  type="text"
                  value={customIdInput}
                  onChange={(e) => setCustomIdInput(e.target.value)}
                  placeholder="e.g. 1234567890-abcdefg12345.apps.googleusercontent.com"
                  className="w-full bg-zinc-900 border border-zinc-800 focus:border-indigo-500 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-200 outline-none transition-all placeholder:text-zinc-600"
                />
                <p className="text-[11px] text-zinc-500">
                  Leave empty to reset to the default configuration.
                </p>
              </div>

              {/* Instructions steps */}
              <div className="p-3.5 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 text-[11px] text-zinc-400 space-y-1.5">
                <p className="font-semibold text-indigo-300 flex items-center gap-1.5">
                  <ShieldAlert size={13} /> How to get your VPS Client ID:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400 pl-1 leading-relaxed">
                  <li>Visit <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-400 underline hover:text-indigo-300 inline-flex items-center gap-0.5">Google Cloud Credentials <ExternalLink size={10} /></a>.</li>
                  <li>Click <strong>Create Credentials</strong> &rarr; <strong>OAuth client ID</strong> (Web application).</li>
                  <li>In <strong>Authorized JavaScript origins</strong>, paste your VPS Origin above.</li>
                  <li>Under <strong>Enabled APIs & Services</strong>, enable <strong>Google Drive API</strong>.</li>
                  <li>Copy the generated Client ID, paste it into the field above and click Save.</li>
                </ol>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2">
                {googleClientId ? (
                  <button
                    type="button"
                    onClick={handleClearOAuthClientId}
                    disabled={isSavingCustomId}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Reset to Default
                  </button>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOAuthConfigModal(false)}
                    disabled={isSavingCustomId}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveOAuthClientId}
                    disabled={isSavingCustomId}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 active:scale-95 transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingCustomId ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <span>Save Client ID</span>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
