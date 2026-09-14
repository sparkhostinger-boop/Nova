import React, { useEffect, useState } from "react"; 
import { LoadingOverlay } from "../components/LoadingOverlay";
import axios from "axios";
import { Archive, Download, Trash2, RefreshCw, Plus, Clock, FileArchive, UploadCloud, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { 
  connectGoogleDrive, 
  initDriveAuth, 
  uploadBackupToGoogleDrive, 
  DriveUser, 
  getDriveAccessToken 
} from "../lib/googleDrive";

interface Backup {
  filename: string;
  size: number;
  createdAt: string;
}

export default function ServerBackups({ serverId }: { serverId: string }) {
  const { googleClientId } = useSettings();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [driveUser, setDriveUser] = useState<DriveUser | null>(null);
  const [hasDriveToken, setHasDriveToken] = useState(false);
  const [uploadingToDrive, setUploadingToDrive] = useState<string | null>(null);
  const [driveToast, setDriveToast] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const unsub = initDriveAuth((authUser, tokenPresent) => {
      setDriveUser(authUser);
      setHasDriveToken(tokenPresent);
    });
    return () => unsub();
  }, []);

  const showDriveToast = (msg: string) => {
    setDriveToast(msg);
    setTimeout(() => setDriveToast(null), 4000);
  };

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/servers/${serverId}/backups`);
      setBackups(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, [serverId]);

  const handleCreateBackup = async () => {
    try {
      setIsCreating(true);
      await axios.post(`/api/servers/${serverId}/backups`);
      await fetchBackups();
    } catch (e) {
      alert("Failed to create backup.");
      console.error(e);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!confirm("Are you sure you want to delete this backup?")) return;
    try {
      await axios.delete(`/api/servers/${serverId}/backups/${filename}`);
      fetchBackups();
    } catch (e) {
      alert("Failed to delete backup.");
    }
  };

  const handleDownload = async (filename: string) => {
    try {
      const response = await axios.get(`/api/servers/${serverId}/backups/${filename}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      alert("Failed to download.");
    }
  };

  const handleUploadToGoogleDrive = async (filename: string) => {
    let token = getDriveAccessToken();
    if (!token) {
      try {
        const authRes = await connectGoogleDrive(googleClientId);
        setDriveUser(authRes.user);
        setHasDriveToken(true);
        token = authRes.token;
      } catch (err: any) {
        const isCancelled =
          err?.code === "auth/popup-closed-by-user" ||
          err?.code === "auth/cancelled-popup-request";
        if (!isCancelled) {
          console.error("Google Drive connection error:", err);
          alert(err.message || "Failed to connect Google Drive.");
        }
        return;
      }
    }

    setUploadingToDrive(filename);
    try {
      const response = await axios.get(`/api/servers/${serverId}/backups/${filename}`, {
        responseType: "blob"
      });
      const blob = new Blob([response.data], { type: "application/zip" });
      await uploadBackupToGoogleDrive(blob, filename);
      showDriveToast(`Uploaded ${filename} directly to Google Drive!`);
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to upload backup to Google Drive.");
    } finally {
      setUploadingToDrive(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-5 text-foreground">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h2 className="text-xl md:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground-muted mb-1">Server Backups</h2>
            <p className="text-sm text-muted-foreground">Create, download, and manage your server archives.</p>
          </div>

          <div className="flex items-center gap-2">
            {hasDriveToken && driveUser ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
                <CheckCircle2 size={14} />
                <span>Google Drive Connected ({driveUser.email?.split("@")[0]})</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await connectGoogleDrive(googleClientId);
                    setDriveUser(res.user);
                    setHasDriveToken(true);
                    showDriveToast("Connected to Google Drive!");
                  } catch (e: any) {
                    const isCancelled =
                      e?.code === "auth/popup-closed-by-user" ||
                      e?.code === "auth/cancelled-popup-request";
                    if (!isCancelled) {
                      console.error("Google Drive connection error:", e);
                      alert(e.message || "Failed to connect Google Drive.");
                    }
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700/60 text-xs font-semibold transition-all cursor-pointer"
              >
                <UploadCloud size={14} className="text-indigo-400" />
                <span>Connect Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {driveToast && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span className="font-semibold">{driveToast}</span>
          </div>
        )}

        <div className="bg-muted-subtle border border-border-subtle p-4 md:p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0">
              <FileArchive className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-0.5">Create Backup</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">All files on the server will be converted into a single zip file. This process may take some time depending on your server's size.</p>
            </div>
          </div>
          <button 
            onClick={handleCreateBackup}
            disabled={isCreating}
            className="w-full md:w-auto px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 border border-indigo-400/50 text-foreground font-medium rounded-lg transition-all shadow-lg flex items-center justify-center shrink-0 disabled:opacity-50"
          >
            {isCreating ? (
              <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Zipping files...</>
            ) : (
              <><Plus className="w-4 h-4 mr-2" /> Create Backup</>
            )}
          </button>
        </div>

        <div>
          <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center">
            <Clock className="w-4 h-4 mr-2" /> Recent Backups
          </h3>
          
          <div className="bg-muted-subtle border border-border-subtle rounded-xl overflow-hidden shadow-xl">
            {loading ? (
              <div className="p-12 flex justify-center">
                <RefreshCw className="w-6 h-6 text-indigo-500 animate-spin" />
              </div>
            ) : backups.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <Archive className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
                <h4 className="text-foreground-muted font-medium mb-1">No backups found</h4>
                <p className="text-muted-foreground text-sm">Create a backup above to secure your files.</p>
              </div>
            ) : (
              <div className="divide-y divide-border-subtle">
                {backups.map((backup) => (
                  <div key={backup.filename} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted-subtle transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-zinc-800 rounded-lg">
                        <Archive className="w-5 h-5 text-foreground-muted" />
                      </div>
                      <div>
                        <p className="font-mono text-sm font-medium text-foreground-muted">{backup.filename}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1 gap-3">
                          <span>{formatSize(backup.size)}</span>
                          <span>•</span>
                          <span>{new Date(backup.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => handleUploadToGoogleDrive(backup.filename)}
                        disabled={uploadingToDrive === backup.filename}
                        className="flex-1 md:flex-none flex justify-center items-center px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-medium rounded transition-colors disabled:opacity-50"
                        title="Upload directly to Google Drive"
                      >
                        {uploadingToDrive === backup.filename ? (
                          <><RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Uploading...</>
                        ) : (
                          <><UploadCloud className="w-3.5 h-3.5 mr-1.5" /> Drive</>
                        )}
                      </button>
                      <button 
                        onClick={() => handleDownload(backup.filename)}
                        className="flex-1 md:flex-none flex justify-center items-center px-3 py-1.5 bg-muted hover:bg-muted-hover text-foreground text-xs font-medium rounded transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                      </button>
                      {(user?.role === "admin" || user) && (
                        <button 
                          onClick={() => handleDelete(backup.filename)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
          {(isCreating) && <LoadingOverlay />}
    </div>
  );
}
