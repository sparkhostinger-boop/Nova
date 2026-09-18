
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, User, Trash2, Layout, Upload, RefreshCw, Key, CheckCircle2, AlertCircle, Globe, Sparkles, ExternalLink, Settings } from "lucide-react";
import { LoadingOverlay } from "../components/LoadingOverlay";

export default function SettingsPage(): React.ReactElement {
  const { user, logout, updateUser } = useAuth();
  const { 
    panelName, 
    enableGoogleLogin, googleClientId, firebaseApiKey, firebaseAuthDomain, firebaseProjectId, 
    firebaseStorageBucket, firebaseMessagingSenderId, firebaseAppId, 
    fetchSettings 
  } = useSettings();
  
  const [users, setUsers] = useState<any[]>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState<string | null>(null);

  const [newPanelName, setNewPanelName] = useState<string>(panelName || "Nova Panel");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [isUpdatingSystem, setIsUpdatingSystem] = useState(false);

  const [fbEnableGoogleLogin, setFbEnableGoogleLogin] = useState<boolean>(enableGoogleLogin || false);
  const [customGoogleClientId, setCustomGoogleClientId] = useState<string>(googleClientId || "");
  const [fbApiKey, setFbApiKey] = useState<string>(firebaseApiKey || "");
  const [fbAuthDomain, setFbAuthDomain] = useState<string>(firebaseAuthDomain || "");
  const [fbProjectId, setFbProjectId] = useState<string>(firebaseProjectId || "");
  const [fbStorageBucket, setFbStorageBucket] = useState<string>(firebaseStorageBucket || "");
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState<string>(firebaseMessagingSenderId || "");
  const [fbAppId, setFbAppId] = useState<string>(firebaseAppId || "");
  const [isSavingFirebase, setIsSavingFirebase] = useState(false);
  const [fbStatusMsg, setFbStatusMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [oldPassword, setOldPassword] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [newCustomUsername, setNewCustomUsername] = useState<string>(user?.username || "");
  const [isChangingUsername, setIsChangingUsername] = useState(false);
  const [usernameMsg, setUsernameMsg] = useState<{text: string; type: "success"|"error"} | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await axios.get("/api/system/users");
      setUsers(res.data);
    } catch (e) {}
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  useEffect(() => {
    setNewPanelName(panelName || "Nova Panel");
  }, [panelName]);

  useEffect(() => {
    if (googleClientId !== undefined) {
      setCustomGoogleClientId(googleClientId || "");
    }
  }, [googleClientId]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      await axios.post("/api/system/users", { username, password, role });
      setUsername("");
      setPassword("");
      fetchUsers();
      alert("User created successfully");
    } catch (e: any) {
      alert(e.response?.data?.error || "Error creating user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const changeUserPassword = async (id: string) => {
    try {
      const newPwd = prompt("Enter new password for this user:");
      if (!newPwd) return;
      await axios.put(`/api/system/users/${id}/password`, { newPassword: newPwd });
      alert("Password updated");
    } catch (e: any) {
      alert(e.response?.data?.error || "Error updating password");
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    setIsDeletingUser(id);
    try {
      await axios.delete(`/api/system/users/${id}`);
      fetchUsers();
    } catch (e: any) {
      alert(e.response?.data?.error || "Error deleting user");
    } finally {
      setIsDeletingUser(null);
    }
  };

  const handleSystemUpdate = async () => {
    if (!confirm("This will pull the latest code and rebuild the panel. It may cause a few seconds of downtime. Continue?")) return;
    setIsUpdatingSystem(true);
    try {
      await axios.post("/api/system/update");
      alert("Update triggered successfully. The panel will reload shortly.");
      setTimeout(() => {
        window.location.reload();
      }, 5000);
    } catch (e: any) {
      alert(e.response?.data?.error || "Error triggering update");
    } finally {
      setIsUpdatingSystem(false);
    }
  };

  const handleSaveFirebase = async () => {
    setIsSavingFirebase(true);
    setFbStatusMsg(null);
    try {
      await axios.put("/api/system/settings", {
        enableGoogleLogin: fbEnableGoogleLogin,
        googleClientId: customGoogleClientId.trim(),
        firebaseApiKey: fbApiKey,
        firebaseAuthDomain: fbAuthDomain,
        firebaseProjectId: fbProjectId,
        firebaseStorageBucket: fbStorageBucket,
        firebaseMessagingSenderId: fbMessagingSenderId,
        firebaseAppId: fbAppId
      });
      await fetchSettings();
      setFbStatusMsg({ text: "Authentication settings saved successfully!", type: "success" });
    } catch (err: any) {
      setFbStatusMsg({ text: err.response?.data?.error || "Failed to save configuration", type: "error" });
    } finally {
      setIsSavingFirebase(false);
    }
  };

  const renderGoogleFirebase = () => {
    return (
      <div className="bg-card border border-border-subtle rounded-2xl p-4 md:p-5 shadow-xl mt-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <Globe size={100} />
        </div>
        <h2 className="text-xl font-bold mb-4 flex items-center text-foreground relative z-10">
          <Key className="mr-3 text-amber-500 w-5 h-5" /> Firebase & Google OAuth Authentication
        </h2>
        
        <div className="max-w-4xl relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-center gap-3 bg-muted p-2 rounded-xl border border-border">
                <span className="text-xs font-semibold text-muted-foreground">Enable Google Login:</span>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input 
                    type="checkbox" 
                    checked={fbEnableGoogleLogin} 
                    onChange={(e: any) => setFbEnableGoogleLogin(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
                <div className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-2">
                  <Sparkles size={16} /> How to Setup Google Login:
                </div>
                <ol className="list-decimal list-inside space-y-1 mt-2 text-muted-foreground">
                  <li>Open <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" className="text-amber-400 underline font-medium hover:text-amber-300 inline-flex items-center gap-1">Firebase Console</a></li>
                  <li>Enable <strong>Google</strong> under Authentication.</li>
                  <li>Add your domain to <strong>Authorized Domains</strong>.</li>
                  <li>Copy credentials from <strong>Project Settings</strong> to the right.</li>
                </ol>
              </div>

              <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-200/90 leading-relaxed">
                <div className="font-bold text-indigo-300 text-sm mb-1 flex items-center gap-2">
                  <Globe size={16} /> VPS Custom Google Drive / OAuth Setup:
                </div>
                <ol className="list-decimal list-inside space-y-1 mt-2 text-muted-foreground">
                  <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-400 underline font-medium hover:text-indigo-300 inline-flex items-center gap-1">Google Cloud Credentials</a>.</li>
                  <li>Create <strong>OAuth client ID</strong> &rarr; <strong>Web application</strong>.</li>
                  <li>In <em>Authorized JavaScript origins</em>, add:
                    <div className="flex items-center gap-2 mt-1">
                      <code className="bg-zinc-800 text-indigo-300 px-2 py-0.5 rounded text-[11px] font-mono">
                        {typeof window !== "undefined" ? window.location.origin : "http://your-vps:3000"}
                      </code>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin);
                          alert(`Copied:\n${window.location.origin}\n\nAdd this to Google Cloud Console Authorized JavaScript origins.`);
                        }}
                        className="text-[11px] bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 px-2 py-0.5 rounded border border-indigo-500/30 transition-colors"
                      >
                        Copy Origin
                      </button>
                    </div>
                  </li>
                  <li>Enable the <strong>Google Drive API</strong> in APIs & Services.</li>
                  <li>Paste the Client ID on the right and click save!</li>
                </ol>
              </div>
            </div>

            <div className="flex-1 space-y-3 bg-background/50 p-4 rounded-2xl border border-border">
              {fbStatusMsg && (
                <div className={`p-3 rounded-xl flex items-center gap-2 text-sm font-medium ${fbStatusMsg.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
                  {fbStatusMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  {fbStatusMsg.text}
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex flex-col p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      Custom Google Client ID (Drive & VPS)
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">Optional</span>
                  </div>
                  <input 
                    type="text" 
                    value={customGoogleClientId} 
                    onChange={(e) => setCustomGoogleClientId(e.target.value)} 
                    className="bg-muted border border-border rounded-lg px-3 py-2 text-xs font-mono" 
                    placeholder="123456789-abcdef.apps.googleusercontent.com" 
                  />
                  <span className="text-[11px] text-muted-foreground mt-1">
                    Allows you and other administrators to connect their own Google Drive on your custom VPS or domain.
                  </span>
                </div>

                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Firebase API Key</label>
                  <input type="text" value={fbApiKey} onChange={(e) => setFbApiKey(e.target.value)} className="bg-muted border border-border rounded-lg px-3 py-2 text-sm" placeholder="AIzaSy..." />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Auth Domain</label>
                  <input type="text" value={fbAuthDomain} onChange={(e) => setFbAuthDomain(e.target.value)} className="bg-muted border border-border rounded-lg px-3 py-2 text-sm" placeholder="project.firebaseapp.com" />
                </div>
                <div className="flex flex-col">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Project ID</label>
                  <input type="text" value={fbProjectId} onChange={(e) => setFbProjectId(e.target.value)} className="bg-muted border border-border rounded-lg px-3 py-2 text-sm" placeholder="project-123" />
                </div>
              </div>
              <button 
                disabled={isSavingFirebase}
                onClick={handleSaveFirebase}
                className="w-full mt-2 bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 rounded-xl transition-all shadow-md disabled:opacity-50"
              >
                {isSavingFirebase ? "Saving..." : "Save Authentication Settings"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 pb-20 relative z-10"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border-subtle p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 shadow-inner">
            <Settings className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Platform Settings</h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">Manage global panel configuration, branding, and system users.</p>
          </div>
        </div>
      </div>

      {user.role === "admin" && (
        <div className="bg-card border border-border-subtle rounded-2xl p-4 md:p-5 shadow-xl mt-6 relative overflow-hidden">
          <h2 className="text-xl font-bold mb-6 flex items-center text-foreground">
            <Layout className="mr-3 text-indigo-400 w-5 h-5" /> Branding & Identity
          </h2>
          <div className="flex flex-col gap-4 max-w-2xl">
            <form 
              onSubmit={async (e: any) => {
                e.preventDefault();
                setIsSavingSettings(true);
                try {
                  await axios.put("/api/system/settings", { panelName: newPanelName });
                  fetchSettings();
                } catch (err: any) {
                  alert(err.response?.data?.error || "Error updating settings");
                } finally {
                  setIsSavingSettings(false);
                }
              }}
            >
              <label className="block text-sm font-medium text-muted-foreground mb-2">Panel Name</label>
              <div className="flex gap-3">
                <input 
                  required 
                  value={newPanelName} 
                  onChange={(e: any) => setNewPanelName(e.target.value)} 
                  type="text" 
                  placeholder="Enter panel name"
                  className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-foreground focus:outline-none focus:border-indigo-500"
                />
                <button disabled={isSavingSettings} type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2 rounded-xl transition-all shadow-md active:scale-[0.98] whitespace-nowrap disabled:opacity-50">
                  {isSavingSettings ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {renderGoogleFirebase()}

      {user.role === "admin" && (
        <div className="bg-card border border-border-subtle rounded-2xl p-4 md:p-5 shadow-xl mt-6 relative overflow-hidden">
          <h2 className="text-xl font-bold mb-6 flex items-center text-foreground">
            <Shield className="mr-3 text-indigo-400 w-5 h-5" /> User Management
          </h2>
          <form onSubmit={createUser} className="flex gap-3 mb-6 flex-wrap">
            <input required type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} className="bg-background border border-border px-3 py-2 rounded-xl flex-1 min-w-[150px]" />
            <input required type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-background border border-border px-3 py-2 rounded-xl flex-1 min-w-[150px]" />
            <select value={role} onChange={(e) => setRole(e.target.value)} className="bg-background border border-border px-3 py-2 rounded-xl">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button type="submit" disabled={isCreatingUser} className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-xl text-white font-medium shadow-md transition-all active:scale-[0.98]">
              {isCreatingUser ? "Creating..." : "Add User"}
            </button>
          </form>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 rounded-l-xl">Username</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u: any) => (
                  <tr key={u.id} className="border-b border-border-subtle last:border-0 hover:bg-muted/50">
                    <td className="px-4 py-3 font-medium text-foreground">{u.username}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${u.role === 'admin' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-500/20 text-slate-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => changeUserPassword(u.id)} className="p-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors">
                          <Key size={14} />
                        </button>
                        <button onClick={() => deleteUser(u.id)} disabled={isDeletingUser === u.id} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {user.role === "admin" && (
        <div className="bg-card border border-border-subtle rounded-2xl p-4 md:p-5 shadow-xl mt-6 relative overflow-hidden">
          <h2 className="text-xl font-bold mb-4 flex items-center text-foreground">
            <RefreshCw className="mr-3 text-emerald-400 w-5 h-5" /> System Update
          </h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-2xl">
            Trigger an automatic update of Nova. This will run git pull and rebuild the system. The panel will be unavailable for a few seconds during this process.
          </p>
          <button 
            onClick={handleSystemUpdate}
            disabled={isUpdatingSystem}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium rounded-xl border border-emerald-500/20 transition-all shadow-sm flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isUpdatingSystem ? "animate-spin" : ""}`} />
            {isUpdatingSystem ? "Updating System..." : "Update Panel"}
          </button>
        </div>
      )}

      {(isSavingSettings || isUpdatingSystem) && <LoadingOverlay />}
    </motion.div>
  );
}
