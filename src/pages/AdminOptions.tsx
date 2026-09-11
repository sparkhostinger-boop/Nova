import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sliders, 
  Globe2, 
  Compass, 
  Sparkles, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  RotateCcw,
  ShieldCheck,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

export default function AdminOptions(): React.ReactElement {
  const { user } = useAuth();
  const { 
    enablePlayit, 
    enableTutorial, 
    enableLoginAnimation, 
    enableRegistration, 
    fetchSettings 
  } = useSettings();

  const [playit, setPlayit] = useState<boolean>(enablePlayit ?? false);
  const [tutorial, setTutorial] = useState<boolean>(enableTutorial ?? true);
  const [loginAnimation, setLoginAnimation] = useState<boolean>(enableLoginAnimation ?? true);
  const [registration, setRegistration] = useState<boolean>(enableRegistration ?? true);

  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    setPlayit(enablePlayit ?? false);
    setTutorial(enableTutorial ?? true);
    setLoginAnimation(enableLoginAnimation ?? true);
    setRegistration(enableRegistration ?? true);
  }, [enablePlayit, enableTutorial, enableLoginAnimation, enableRegistration]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleToggle = async (key: string, value: boolean, label: string) => {
    setSavingKey(key);
    try {
      if (key === "enablePlayit") setPlayit(value);
      if (key === "enableTutorial") setTutorial(value);
      if (key === "enableLoginAnimation") setLoginAnimation(value);
      if (key === "enableRegistration") setRegistration(value);

      await axios.put("/api/system/settings", { [key]: value });
      await fetchSettings();
      showToast(`${label} ${value ? "enabled" : "disabled"} successfully!`, "success");
    } catch (err: any) {
      // Revert state on error
      if (key === "enablePlayit") setPlayit(!value);
      if (key === "enableTutorial") setTutorial(!value);
      if (key === "enableLoginAnimation") setLoginAnimation(!value);
      if (key === "enableRegistration") setRegistration(!value);
      showToast(err.response?.data?.error || `Failed to update ${label}`, "error");
    } finally {
      setSavingKey(null);
    }
  };

  const handleRestartTutorial = () => {
    if (!user?.id) return;
    const isDev = process.env.NODE_ENV === "development";
    const tutorialKey = isDev ? `tutorialShown_dev_${user.id}` : `tutorialShown_prod_${user.id}`;
    if (isDev) {
      sessionStorage.removeItem(tutorialKey);
    } else {
      localStorage.removeItem(tutorialKey);
    }
    showToast("Tutorial reset! Redirecting to home...", "success");
    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  };

  const optionsList = [
    {
      id: "enablePlayit",
      title: "Playit.gg Tunnel Integration",
      description: "Allow users to securely expose game servers to the public internet using automated playit.gg network tunnels without manual port forwarding.",
      value: playit,
      icon: <Globe2 className="w-6 h-6 text-cyan-400" />,
      accentColor: "cyan",
      badge: playit ? "Active" : "Disabled",
      actionSlot: null
    },
    {
      id: "enableTutorial",
      title: "Onboarding Guided Tour",
      description: "Display an interactive step-by-step onboarding walkthrough to new users on their initial dashboard visit to highlight navigation and server tools.",
      value: tutorial,
      icon: <Compass className="w-6 h-6 text-indigo-400" />,
      accentColor: "indigo",
      badge: tutorial ? "Active" : "Disabled",
      actionSlot: (
        <button
          type="button"
          onClick={handleRestartTutorial}
          className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-muted hover:bg-muted-hover text-foreground border border-border transition-all active:scale-95 shadow-sm cursor-pointer"
        >
          <RotateCcw size={13} className="text-indigo-400" />
          <span>Restart Tutorial for My Account</span>
        </button>
      )
    },
    {
      id: "enableLoginAnimation",
      title: "Cinematic Login Intro",
      description: "Enable the smooth ambient particle motion and cinematic portal transition sequence on the authentication and login pages.",
      value: loginAnimation,
      icon: <Sparkles className="w-6 h-6 text-amber-400" />,
      accentColor: "amber",
      badge: loginAnimation ? "Active" : "Disabled",
      actionSlot: null
    },
    {
      id: "enableRegistration",
      title: "Public User Registration",
      description: "Allow new visitors and players to create accounts directly from the panel login gateway without requiring pre-approval from an administrator.",
      value: registration,
      icon: <UserPlus className="w-6 h-6 text-emerald-400" />,
      accentColor: "emerald",
      badge: registration ? "Active" : "Disabled",
      actionSlot: null
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-20 relative z-10"
    >
      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border ${
              toastMessage.type === "success" 
                ? "bg-emerald-600 text-white border-emerald-400/40" 
                : "bg-red-600 text-white border-red-400/40"
            }`}
          >
            {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/70 backdrop-blur-xl border border-border-subtle p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-inner">
            <Sliders className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
              Panel Options
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Toggle global platform features, public registration, network tunnels, and user onboarding.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchSettings()}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-foreground bg-muted hover:bg-muted-hover rounded-xl border border-border transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {optionsList.map((item) => {
          const isBusy = savingKey === item.id;
          return (
            <div
              key={item.id}
              className="bg-card/80 backdrop-blur-xl border border-border-subtle hover:border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-muted border border-border-subtle">
                      {item.icon}
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground">{item.title}</h2>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-mono font-bold rounded-md mt-1 ${
                        item.value 
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                          : "bg-muted text-muted-foreground border border-border"
                      }`}>
                        {item.badge}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-1">
                    <input
                      type="checkbox"
                      checked={item.value}
                      disabled={isBusy}
                      onChange={(e) => handleToggle(item.id, e.target.checked, item.title)}
                      className="sr-only peer"
                    />
                    <div className="w-12 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-6 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>

              {item.actionSlot && (
                <div className="pt-2 border-t border-border-subtle">
                  {item.actionSlot}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Security notice */}
      <div className="p-4 rounded-2xl bg-muted/40 border border-border-subtle flex items-center gap-3 text-xs text-muted-foreground">
        <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
        <span>
          Changes made to platform options take effect immediately across all active browser sessions and connected server nodes.
        </span>
      </div>
    </motion.div>
  );
}
