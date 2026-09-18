import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSettings } from "../context/SettingsContext";
import axios from "axios";
import { Plus, X, Settings, Check, ShieldAlert, MessageSquare, LayoutTemplate, Activity, AlertTriangle, ShieldCheck } from "lucide-react";

export default function AdminAddons() {
  const { addons, setAddons } = useSettings();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Local state for modal configuration to avoid immediate saves on every keystroke
  const [modalConfig, setModalConfig] = useState<any>({});
  
  const defaultAddonsConfig = {
    footer: { enabled: false, startYear: "2024", endYear: "", customText: "Powered by Nova Panel | All Rights Reserved" },
    discord: { enabled: false, inviteUrl: "https://discord.gg", position: "Top-Right", buttonStyle: "Standard" },
    antibot: { enabled: false, targetPages: ["login", "register"], captchaMode: "Random", maxRetries: 3 },
    maintenance: { enabled: false, message: "Server is currently down for maintenance.", timer: "" },
    analytics: { enabled: false, visibility: "Admin-only", refreshInterval: 5 }
  };

  const currentAddons = { ...defaultAddonsConfig, ...(addons || {}) };

  const saveAddons = async (newAddons: any) => {
    try {
      await axios.put("/api/system/settings", { addons: newAddons });
      setAddons(newAddons);
    } catch (e) {
      console.error("Failed to save addons", e);
    }
  };

  const toggleAddon = (key: string) => {
    const willEnable = !currentAddons[key]?.enabled;
    const extra = key === "discord" && willEnable && !currentAddons[key]?.inviteUrl
      ? { inviteUrl: "https://discord.gg" }
      : {};
    const updated = {
      ...currentAddons,
      [key]: {
        ...currentAddons[key],
        ...extra,
        enabled: willEnable
      }
    };
    saveAddons(updated);
  };

  const openSettings = (key: string) => {
    setModalConfig({ ...currentAddons[key] });
    setActiveModal(key);
  };

  const saveModalSettings = () => {
    if (!activeModal) return;
    const finalConfig = { ...modalConfig };
    if (activeModal === "discord" && !finalConfig.inviteUrl?.trim()) {
      finalConfig.inviteUrl = "https://discord.gg";
    }
    const updated = {
      ...currentAddons,
      [activeModal]: {
        ...finalConfig
      }
    };
    saveAddons(updated);
    setActiveModal(null);
  };

  const addonsList = [
    {
      id: "footer",
      title: "Server Footer Addon",
      description: "Adds a custom, dynamic footer across your site or panel.",
      icon: <LayoutTemplate size={24} className="text-indigo-400" />
    },
    {
      id: "discord",
      title: "Discord Integration",
      description: "Embeds an interactive Discord join link directly into the panel.",
      icon: <MessageSquare size={24} className="text-blue-400" />
    },
    {
      id: "antibot",
      title: "Anti-Bot Security Suite",
      description: "Adds high-security visual CAPTCHA verification to prevent automated spam.",
      icon: <ShieldAlert size={24} className="text-red-400" />,
      tag: "Beta",
      tagBadgeClass: "bg-blue-500/15 text-blue-400 border border-blue-500/30"
    },
    {
      id: "maintenance",
      title: "Maintenance Mode",
      description: "Displays global notification banners or restricts site access.",
      icon: <AlertTriangle size={24} className="text-amber-400" />
    },
    {
      id: "analytics",
      title: "Server Analytics & Uptime",
      description: "Displays public or admin-only server health, RAM/CPU stats.",
      icon: <Activity size={24} className="text-emerald-400" />,
      tag: "Alpha",
      tagBadgeClass: "bg-amber-500/15 text-amber-400 border border-amber-500/30"
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 md:p-8 max-w-6xl mx-auto"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Addons & Integrations</h1>
        <p className="text-muted-foreground mt-2">Manage extensions, integrations, and additional features for your panel.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {addonsList.map(addon => {
          const config = currentAddons[addon.id];
          const isEnabled = config?.enabled || false;
          
          return (
            <div key={addon.id} className="relative bg-card/50 backdrop-blur-xl border border-border p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-border-strong transition-all flex flex-col group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-muted rounded-xl border border-border-subtle">
                  {addon.icon}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {isEnabled ? 'Active' : 'Disabled'}
                    </span>
                    <div className={`w-2.5 h-2.5 rounded-full ${isEnabled ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                  </div>
                  
                  <button 
                    onClick={() => openSettings(addon.id)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    <Settings size={18} />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-foreground">{addon.title}</h3>
                {addon.tag && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${addon.tagBadgeClass}`}>
                    {addon.tag}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground flex-1 mb-6">{addon.description}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-border-subtle mt-auto">
                <span className="text-sm font-medium text-foreground">Toggle Addon</span>
                <button
                  onClick={() => toggleAddon(addon.id)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${isEnabled ? 'bg-indigo-500' : 'bg-muted border border-border-strong'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveModal(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden z-10"
            >
              <div className="p-5 border-b border-border-subtle flex justify-between items-center bg-muted/30">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-foreground">
                    {addonsList.find(a => a.id === activeModal)?.title} Settings
                  </h3>
                  {addonsList.find(a => a.id === activeModal)?.tag && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${addonsList.find(a => a.id === activeModal)?.tagBadgeClass}`}>
                      {addonsList.find(a => a.id === activeModal)?.tag}
                    </span>
                  )}
                </div>
                <button onClick={() => setActiveModal(null)} className="text-muted-foreground hover:text-foreground">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                {activeModal === "footer" && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">Start Year</label>
                        <input 
                          type="text" 
                          value={modalConfig.startYear || ""} 
                          onChange={e => setModalConfig({...modalConfig, startYear: e.target.value})}
                          placeholder="e.g. 2024"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1.5">End Year (Optional)</label>
                        <input 
                          type="text" 
                          value={modalConfig.endYear || ""} 
                          onChange={e => setModalConfig({...modalConfig, endYear: e.target.value})}
                          placeholder="Leave blank for auto"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Custom Text</label>
                      <input 
                        type="text" 
                        value={modalConfig.customText || ""} 
                        onChange={e => setModalConfig({...modalConfig, customText: e.target.value})}
                        placeholder="Powered by Nova Panel | All Rights Reserved"
                      />
                    </div>
                  </>
                )}
                
                {activeModal === "discord" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Discord Invite URL</label>
                      <input 
                        type="text" 
                        value={modalConfig.inviteUrl || ""} 
                        onChange={e => setModalConfig({...modalConfig, inviteUrl: e.target.value})}
                        placeholder="https://discord.gg/..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Icon Position</label>
                      <select 
                        value={modalConfig.position || "Top-Right"} 
                        onChange={e => setModalConfig({...modalConfig, position: e.target.value})}
                      >
                        <option value="Top-Right">Top-Right (Sidebar Header)</option>
                        <option value="Bottom-Right">Bottom-Right (Floating)</option>
                        <option value="Dashboard">Dashboard Cards</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Button Style</label>
                      <select 
                        value={modalConfig.buttonStyle || "Standard"} 
                        onChange={e => setModalConfig({...modalConfig, buttonStyle: e.target.value})}
                      >
                        <option value="Standard">Standard Discord Logo</option>
                        <option value="Labeled">Labeled Button ("Join Discord")</option>
                      </select>
                    </div>
                  </>
                )}

                {activeModal === "antibot" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Captcha Mode</label>
                      <select 
                        value={modalConfig.captchaMode || "Random"} 
                        onChange={e => setModalConfig({...modalConfig, captchaMode: e.target.value})}
                      >
                        <option value="Random">Random per Request</option>
                        <option value="Pattern">Pattern Click</option>
                        <option value="Color">Color Matching</option>
                        <option value="Symbol">Symbol Keying</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Max Retries</label>
                      <input 
                        type="number" 
                        min="1" max="10"
                        value={modalConfig.maxRetries || 3} 
                        onChange={e => setModalConfig({...modalConfig, maxRetries: parseInt(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-2">Target Pages</label>
                      <div className="space-y-2">
                        {["login", "register", "password_reset"].map(page => (
                          <label key={page} className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={modalConfig.targetPages?.includes(page) || false}
                              onChange={e => {
                                const current = modalConfig.targetPages || [];
                                if (e.target.checked) {
                                  setModalConfig({...modalConfig, targetPages: [...current, page]});
                                } else {
                                  setModalConfig({...modalConfig, targetPages: current.filter((p: string) => p !== page)});
                                }
                              }}
                              className="rounded border-border bg-muted/50 text-indigo-600 focus:ring-indigo-500/50 h-4 w-4"
                            />
                            <span className="text-sm text-foreground capitalize">{page.replace('_', ' ')}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                {activeModal === "maintenance" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Banner Message</label>
                      <textarea 
                        value={modalConfig.message || ""} 
                        onChange={e => setModalConfig({...modalConfig, message: e.target.value})}
                        className="h-24 resize-none"
                        placeholder="Server is currently down for maintenance. We will be back shortly."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Countdown Timer (Optional)</label>
                      <input 
                        type="datetime-local" 
                        value={modalConfig.timer || ""} 
                        onChange={e => setModalConfig({...modalConfig, timer: e.target.value})}
                      />
                    </div>
                  </>
                )}

                {activeModal === "analytics" && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Visibility</label>
                      <select 
                        value={modalConfig.visibility || "Admin-only"} 
                        onChange={e => setModalConfig({...modalConfig, visibility: e.target.value})}
                      >
                        <option value="Admin-only">Admin-only</option>
                        <option value="Public">Public (Server Overview)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1.5">Refresh Interval (Seconds)</label>
                      <input 
                        type="number" 
                        min="1" max="60"
                        value={modalConfig.refreshInterval || 5} 
                        onChange={e => setModalConfig({...modalConfig, refreshInterval: parseInt(e.target.value)})}
                      />
                    </div>
                  </>
                )}

              </div>
              
              <div className="p-5 border-t border-border-subtle bg-muted/30 flex justify-end gap-3">
                <button 
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveModalSettings}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors flex items-center gap-2 shadow-md shadow-indigo-500/20"
                >
                  <Check size={16} /> Save Settings
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
