import React, { useState, useEffect } from "react";
import axios from "axios";
import { Key, Plus, Trash2, RefreshCw, Copy, Check, AlertTriangle, Loader2, X, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ApiKeyItem {
  id: string;
  label: string;
  scopes?: string[];
  created_by?: string;
  created_at: string;
  expires_at?: string | null;
  last_used_at?: string | null;
  revoked?: boolean;
}

export default function ApiKeysManager() {
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [newKeyString, setNewKeyString] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Delete modal state
  const [keyToDelete, setKeyToDelete] = useState<ApiKeyItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // UI feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const fetchApiKeys = async (manual = false) => {
    if (manual) setIsRefreshing(true);
    try {
      const res = await axios.get("/api/admin/api-keys");
      setApiKeys(Array.isArray(res.data) ? res.data : []);
    } catch (e: any) {
      console.error("Failed to fetch API keys", e);
      if (manual) {
        setErrorMessage(e.response?.data?.error || "Failed to fetch API keys");
      }
    } finally {
      setIsLoading(false);
      if (manual) setIsRefreshing(false);
    }
  };

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = await axios.post("/api/admin/api-keys", {
        label: newKeyLabel.trim() || "API Key",
        scopes: ["*"] // Default full access
      });
      setNewKeyString(res.data.key);
      setShowAddModal(false);
      setNewKeyLabel("");
      setSuccessMessage("API key generated successfully! Make sure to copy it now.");
      setTimeout(() => setSuccessMessage(null), 5000);
      await fetchApiKeys();
    } catch (e: any) {
      console.error("Failed to create API key", e);
      setErrorMessage(e.response?.data?.error || "Failed to create API key");
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmDeleteKey = (key: ApiKeyItem) => {
    setKeyToDelete(key);
  };

  const executeDeleteKey = async (id: string) => {
    setIsDeleting(true);
    setDeletingId(id);
    setErrorMessage(null);

    try {
      await axios.delete(`/api/admin/api-keys/${id}`);
      // Optimistically remove from state
      setApiKeys((prev) => prev.filter((k) => k.id !== id));
      setKeyToDelete(null);
      setSuccessMessage("API key deleted successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
      // Re-fetch to ensure sync with server
      await fetchApiKeys();
    } catch (e: any) {
      console.error("Failed to delete API key", e);
      setErrorMessage(e.response?.data?.error || "Failed to delete API key. Please try again.");
    } finally {
      setIsDeleting(false);
      setDeletingId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border-subtle rounded-2xl p-6 shadow-xl mt-8">
        <div className="flex items-center space-x-3 text-muted-foreground animate-pulse py-8 justify-center">
          <Loader2 className="animate-spin text-indigo-400" size={24} />
          <span>Loading API keys...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border-subtle rounded-2xl p-4 md:p-6 shadow-xl mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">API Keys</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium text-muted-foreground">
                {apiKeys.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate and manage API keys for automated scripts and external integrations
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => fetchApiKeys(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-muted hover:bg-muted-hover text-muted-foreground hover:text-foreground rounded-xl transition-colors border border-border-subtle disabled:opacity-50"
            title="Refresh list"
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin text-indigo-400" : ""} />
          </button>
          <button 
            onClick={() => {
              setNewKeyString(null);
              setShowAddModal(true);
            }}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md shadow-indigo-500/20"
          >
            <Plus size={18} />
            <span>Generate Key</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="mb-5 p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Check size={18} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="p-1 hover:bg-emerald-500/20 rounded-md transition-colors text-emerald-300"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={18} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button 
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:bg-red-500/20 rounded-md transition-colors text-red-300"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Newly Generated Key Callout */}
      {newKeyString && (
        <div className="mb-6 bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4 md:p-5 relative overflow-hidden">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-indigo-400 font-bold text-base">New API Key Generated!</h3>
            </div>
            <button 
              onClick={() => setNewKeyString(null)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
              title="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
          <p className="text-muted-foreground text-xs md:text-sm mb-3">
            Please copy this key now and store it in a secure location. You will not be able to view the full key secret again once closed.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-black/60 text-indigo-300 border border-indigo-500/30 px-3.5 py-2.5 rounded-xl font-mono text-sm break-all select-all">
              {newKeyString}
            </code>
            <button 
              onClick={() => copyToClipboard(newKeyString)}
              className="px-3.5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-all font-medium text-xs flex items-center gap-1.5 shrink-0 shadow-sm"
              title="Copy API Key"
            >
              {copiedKey ? (
                <>
                  <Check size={16} />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Key List */}
      {apiKeys.length === 0 ? (
        <div className="text-center py-12 px-4 border border-dashed border-border-subtle bg-muted-subtle rounded-xl">
          <div className="w-12 h-12 rounded-2xl bg-muted mx-auto flex items-center justify-center text-muted-foreground mb-3">
            <Key size={24} />
          </div>
          <h3 className="font-semibold text-foreground text-sm mb-1">No API keys created yet</h3>
          <p className="text-muted-foreground text-xs max-w-sm mx-auto mb-4">
            API keys allow you to authenticate with the Nova Panel REST API to manage servers, backups, and configurations.
          </p>
          <button
            onClick={() => {
              setNewKeyString(null);
              setShowAddModal(true);
            }}
            className="inline-flex items-center space-x-2 px-3.5 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-xs font-medium rounded-xl transition-all"
          >
            <Plus size={15} />
            <span>Generate First Key</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {apiKeys.map((key) => {
            const isThisDeleting = deletingId === key.id;
            return (
              <div 
                key={key.id} 
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted-subtle border border-border-subtle rounded-xl transition-all ${
                  key.revoked ? "opacity-50" : "hover:border-border hover:bg-muted"
                }`}
              >
                <div className="mb-3 sm:mb-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground text-sm">{key.label || "Unnamed Key"}</h4>
                    {key.revoked ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                        Revoked
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1 font-mono text-[11px] text-muted-foreground/80">
                      ID: {key.id.slice(0, 8)}...
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-muted-foreground" />
                      Created: {new Date(key.created_at).toLocaleDateString()}
                    </span>
                    <span>
                      Last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "Never"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button 
                    onClick={() => confirmDeleteKey(key)}
                    disabled={isThisDeleting || isDeleting}
                    className="p-2 text-muted-foreground bg-muted border border-border-subtle hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/10 active:bg-red-500/20 rounded-xl transition-all disabled:opacity-50" 
                    title="Delete Key"
                    aria-label={`Delete API Key ${key.label}`}
                  >
                    {isThisDeleting ? (
                      <Loader2 size={16} className="animate-spin text-red-400" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Generate Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#121214] border border-border shadow-2xl rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-muted/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    <Key size={18} />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Generate API Key</h3>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)} 
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              
              <form onSubmit={handleCreateKey} className="p-5">
                <div className="mb-6">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Key Label / Description
                  </label>
                  <input 
                    type="text" 
                    value={newKeyLabel}
                    onChange={(e) => setNewKeyLabel(e.target.value)}
                    placeholder="e.g. Discord Bot, CI/CD, Monitoring"
                    autoFocus
                    required
                    className="w-full bg-black/40 border border-border rounded-xl px-4 py-3 text-sm text-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    A memorable name to identify which script or integration is using this key.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-muted hover:bg-muted-hover text-foreground font-medium rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 text-white font-medium rounded-xl transition-all shadow-md shadow-indigo-500/20 text-sm disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Key size={16} />
                        <span>Generate Key</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* In-App Delete Confirmation Modal (Avoids browser iframe confirm blocks) */}
      <AnimatePresence>
        {keyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#121214] border border-red-500/30 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border-subtle bg-red-500/5">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Delete API Key</h3>
                    <p className="text-xs text-red-400/80">Permanent action</p>
                  </div>
                </div>
                <button 
                  onClick={() => !isDeleting && setKeyToDelete(null)}
                  disabled={isDeleting}
                  className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <p className="text-sm text-foreground leading-relaxed">
                  Are you sure you want to permanently delete the API key{" "}
                  <span className="font-semibold text-white bg-black/40 px-2 py-0.5 rounded-md border border-border-subtle">
                    {keyToDelete.label || "Unnamed Key"}
                  </span>
                  ?
                </p>
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 flex items-start gap-2.5 leading-relaxed">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-400" />
                  <span>
                    Any applications, scripts, or automations using this key will immediately be denied access. This action cannot be undone.
                  </span>
                </div>
              </div>

              <div className="flex justify-end items-center gap-3 p-5 border-t border-border-subtle bg-muted/50">
                <button
                  type="button"
                  onClick={() => setKeyToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 bg-muted hover:bg-muted-hover text-foreground font-medium rounded-xl transition-colors text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => executeDeleteKey(keyToDelete.id)}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-red-500/20 text-sm disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Delete Key</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
