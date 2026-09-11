import React, { useState, useEffect } from "react";
import axios from "axios";
import { Users, Search, Activity, Shield, UserPlus, Key, Trash2, Eye, EyeOff, Copy, Check, AlertTriangle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function UsersList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Create User State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Edit User State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [adminUserNewPassword, setAdminUserNewPassword] = useState("");
  const [visiblePasswords, setVisiblePasswords] = useState<{ [id: string]: boolean }>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Delete User Modal State
  const [userToDelete, setUserToDelete] = useState<{ id: string; username: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Toast State
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copyPassword = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const fetchUsers = () => {
    axios.get("/api/system/users")
      .then(res => {
        setUsers(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch users", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/");
      return;
    }
    fetchUsers();
  }, [user, navigate]);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingUser(true);
    try {
      await axios.post("/api/system/users", { username, password, role });
      setUsername("");
      setPassword("");
      fetchUsers();
      showToast("User created successfully");
    } catch (e: any) {
      showToast(e.response?.data?.error || "Error creating user", "error");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const changeUserPassword = async (id: string) => {
    try {
      if (adminUserNewPassword.length < 8) {
         showToast("Password must be at least 8 characters", "error");
         return;
      }
      await axios.put(`/api/system/users/${id}/password`, { newPassword: adminUserNewPassword });
      showToast("Password changed successfully");
      setEditingUserId(null);
      setAdminUserNewPassword("");
      fetchUsers();
      if (user.id === id) {
        logout();
      }
    } catch(e: any) {
      showToast(e.response?.data?.error || "Error changing password", "error");
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`/api/system/users/${userToDelete.id}`);
      showToast(`User "${userToDelete.username}" deleted successfully`);
      setUserToDelete(null);
      fetchUsers();
    } catch (e: any) {
      showToast(e.response?.data?.error || "Failed to delete user", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredUsers = users.filter(u => u.username.toLowerCase().includes(search.toLowerCase()));

  if (loading) {
    return (
      <div className="flex-1 p-5 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-5 overflow-y-auto relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 text-sm font-medium backdrop-blur-md ${
              toast.type === "success"
                ? "bg-emerald-950/90 text-emerald-200 border-emerald-500/40"
                : "bg-red-950/90 text-red-200 border-red-500/40"
            }`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white/60 hover:text-white transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete User Confirmation Modal */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3 text-red-400">
                <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">Delete User</h3>
                  <p className="text-xs text-muted-foreground">Permanent action</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Are you sure you want to delete user <strong className="text-foreground font-semibold font-mono bg-muted px-1.5 py-0.5 rounded">{userToDelete.username}</strong>? This will revoke their account access immediately.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setUserToDelete(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 border border-border transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDeleteUser}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete User</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-indigo-500" />
              User Management
            </h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Manage and view all users registered on the panel.
            </p>
          </div>
        </div>

        {/* Create User Form */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-5">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2 border-b border-border-subtle pb-2">
            <UserPlus className="w-5 h-5 text-emerald-400" /> Create New User
          </h3>
          <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input 
              required 
              value={username} 
              onChange={(e: any) => setUsername(e.target.value)} 
              type="text" 
              placeholder="Username"
              className="bg-muted border border-border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 rounded-xl px-3 py-2 text-foreground transition-all outline-none"
            />
            <input 
              required 
              value={password} 
              onChange={(e: any) => setPassword(e.target.value)} 
              type="password" 
              placeholder="Password"
              className="bg-muted border border-border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 rounded-xl px-3 py-2 text-foreground transition-all outline-none"
            />
            <select 
              value={role} 
              onChange={(e: any) => setRole(e.target.value)}
              className="bg-muted border border-border focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 rounded-xl px-3 py-2 text-foreground transition-all outline-none"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button 
              disabled={isCreatingUser} 
              type="submit" 
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center whitespace-nowrap cursor-pointer"
            >
              {isCreatingUser ? "Creating..." : "Create User"}
            </button>
          </form>
        </div>

        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl shadow-sm p-4 flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div className="text-sm text-muted-foreground ml-auto font-medium">
            Total Users: {users.length}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">User</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Password</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Auth Method</th>
                  <th className="p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-5 text-center text-muted-foreground">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u, i) => (
                    <motion.tr 
                      key={u.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
                            {u.username[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">{u.username}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <Activity className="w-3 h-3" /> Active User
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {u.isGoogleUser ? (
                          <span className="text-xs text-muted-foreground italic">Google Account</span>
                        ) : (
                          <div className="inline-flex items-center gap-2 bg-muted/70 hover:bg-muted px-2.5 py-1.5 rounded-lg border border-border/60 transition-colors">
                            <span className="font-mono text-xs font-medium text-foreground tracking-wider select-all">
                              {visiblePasswords[u.id]
                                ? (u.password || "••••••••")
                                : (u.password ? "•".repeat(Math.min(u.password.length, 10)) : "••••••••")}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibility(u.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded cursor-pointer"
                              title={visiblePasswords[u.id] ? "Hide Password" : "Show Password"}
                            >
                              {visiblePasswords[u.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                            {u.password && u.password !== "••••••••" && (
                              <button
                                type="button"
                                onClick={() => copyPassword(u.id, u.password)}
                                className="text-muted-foreground hover:text-emerald-400 transition-colors p-0.5 rounded cursor-pointer"
                                title="Copy Password"
                              >
                                {copiedId === u.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${u.role === 'admin' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'}`}>
                          {u.role === 'admin' && <Shield className="w-3 h-3" />}
                          {u.role || 'user'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground">
                        {u.isGoogleUser ? 'Google OAuth' : 'Local Account'}
                      </td>
                      <td className="p-3 text-right">
                        {editingUserId === u.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <input 
                              type="password" 
                              placeholder="New Pass" 
                              value={adminUserNewPassword} 
                              onChange={(e: any) => setAdminUserNewPassword(e.target.value)}
                              className="bg-black/40 border border-border focus:border-indigo-500 rounded-lg px-2 py-1 text-xs w-28 text-foreground outline-none"
                            />
                            <button onClick={() => changeUserPassword(u.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-2 py-1.5 rounded-lg transition-all cursor-pointer">Save</button>
                            <button onClick={() => setEditingUserId(null)} className="bg-muted hover:bg-muted-hover text-foreground-muted text-xs px-2 py-1.5 rounded-lg border border-border transition-all cursor-pointer">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => setEditingUserId(u.id)} className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors cursor-pointer" title="Change Password">
                              <Key size={16} />
                            </button>
                            {u.id !== user?.id && (
                              <button 
                                onClick={() => setUserToDelete({ id: u.id, username: u.username })} 
                                className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer" 
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
