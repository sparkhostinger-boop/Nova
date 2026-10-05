// @ts-nocheck
import React, { useEffect, useState, useRef, useMemo } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layout, 
  Palette, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Check, 
  RotateCcw, 
  Eye, 
  Sliders, 
  Zap, 
  Flame, 
  Moon, 
  Search, 
  Server, 
  Layers, 
  Terminal, 
  Activity, 
  Gamepad2, 
  Image as ImageIcon, 
  Grid, 
  ListFilter, 
  ArrowRight,
  Plus,
  Radio,
  Boxes,
  Code2,
  Sun,
  Crown,
  Shield,
  Compass,
  Cpu,
  ExternalLink
} from "lucide-react";
import { ImageCropper } from "../components/ImageCropper";

export type ThemeCategory = "Classics" | "Cyber & Neon" | "Warm & Vibrant" | "Dark & AMOLED" | "Gaming & Esports";

export interface InbuiltTheme {
  id: string;
  name: string;
  category: ThemeCategory;
  tagline: string;
  badge?: string;
  version: string;
  icon: any;
  primaryColor: string;
  bgColor: string;
  textColor: string;
  gradient: string;
}

export const CATEGORY_INFO: Record<ThemeCategory, { name: string; desc: string; icon: any; color: string; bg: string }> = {
  "Classics": {
    name: "Classics & Signature",
    desc: "Timeless obsidian, arctic slate, and signature Nova indigo palettes.",
    icon: Layers,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20"
  },
  "Cyber & Neon": {
    name: "Cyber & Neon",
    desc: "Futuristic high-contrast electric neon cyan, matrix green, and radioactive lime.",
    icon: Zap,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20"
  },
  "Dark & AMOLED": {
    name: "Dark & AMOLED",
    desc: "True pitch-black 0% OLED power-saving themes and gothic developer dark modes.",
    icon: Moon,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20"
  },
  "Warm & Vibrant": {
    name: "Warm & Vibrant",
    desc: "Energizing sunset amber, radiant tropical orange, and bold ruby crimson.",
    icon: Flame,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20"
  },
  "Gaming & Esports": {
    name: "Gaming & Esports",
    desc: "Minecraft netherite magma, Night City yellow, and tournament esports green.",
    icon: Gamepad2,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20"
  }
};

export const INBUILT_THEMES: InbuiltTheme[] = [
  // Classics
  {
    id: "nova-classic",
    name: "Nova Classic",
    category: "Classics",
    tagline: "The signature Nova dark dashboard with deep obsidian & crisp indigo neon.",
    badge: "Default",
    version: "1.4.2",
    icon: Layers,
    primaryColor: "#6366f1",
    bgColor: "#030305",
    textColor: "#ffffff",
    gradient: "from-indigo-600 via-indigo-700 to-slate-900"
  },
  {
    id: "amethyst-royal",
    name: "Amethyst Royal",
    category: "Classics",
    tagline: "Enchanted imperial violet glow with luxury dark plum surfaces.",
    badge: "Premium",
    version: "1.5.1",
    icon: Crown,
    primaryColor: "#a855f7",
    bgColor: "#080312",
    textColor: "#faf5ff",
    gradient: "from-purple-600 via-fuchsia-700 to-slate-950"
  },
  {
    id: "nordic-frost",
    name: "Nordic Frost",
    category: "Classics",
    tagline: "Cool arctic glacier sky blue over calming deep fjord slate.",
    badge: "Cool",
    version: "1.2.1",
    icon: Shield,
    primaryColor: "#38bdf8",
    bgColor: "#0b1120",
    textColor: "#f0f9ff",
    gradient: "from-sky-400 via-blue-600 to-slate-950"
  },

  // Cyber & Neon
  {
    id: "midnight-cyber",
    name: "Midnight Cyber",
    category: "Cyber & Neon",
    tagline: "Electric futuristic cyan glow against deep space navy architecture.",
    badge: "Popular",
    version: "1.1.0",
    icon: Radio,
    primaryColor: "#06b6d4",
    bgColor: "#040814",
    textColor: "#f0fdfa",
    gradient: "from-cyan-500 via-blue-600 to-slate-950"
  },
  {
    id: "emerald-terminal",
    name: "Emerald Terminal",
    category: "Cyber & Neon",
    tagline: "Vivid cyber-matrix green over rich deep-forest obsidian.",
    badge: "Vibrant",
    version: "1.3.1",
    icon: Terminal,
    primaryColor: "#10b981",
    bgColor: "#02120b",
    textColor: "#ecfdf5",
    gradient: "from-emerald-500 via-teal-600 to-zinc-950"
  },
  {
    id: "tokyo-synthwave",
    name: "Tokyo Synthwave",
    category: "Cyber & Neon",
    tagline: "Retro 80s arcade neon pink over neon-drenched cyberpunk purple.",
    badge: "Retro",
    version: "1.0.1",
    icon: Activity,
    primaryColor: "#ec4899",
    bgColor: "#0e0416",
    textColor: "#fdf2f8",
    gradient: "from-pink-500 via-fuchsia-600 to-purple-950"
  },
  {
    id: "toxic-lime",
    name: "Toxic Lime",
    category: "Cyber & Neon",
    tagline: "High-voltage radioactive neon lime over deep industrial carbon.",
    badge: "Neon",
    version: "1.1.2",
    icon: Zap,
    primaryColor: "#84cc16",
    bgColor: "#070d03",
    textColor: "#f7fee7",
    gradient: "from-lime-500 via-emerald-600 to-zinc-950"
  },

  // Dark & AMOLED
  {
    id: "amoled-black",
    name: "Pure AMOLED",
    category: "Dark & AMOLED",
    tagline: "Absolute 100% pitch black optimized for zero pixel bleed & OLED battery savings.",
    badge: "OLED",
    version: "1.2.0",
    icon: Moon,
    primaryColor: "#3b82f6",
    bgColor: "#000000",
    textColor: "#f8fafc",
    gradient: "from-blue-600 via-blue-800 to-black"
  },
  {
    id: "dracula-eclipse",
    name: "Dracula Eclipse",
    category: "Dark & AMOLED",
    tagline: "The legendary gothic dark theme beloved by developers and designers.",
    badge: "Gothic",
    version: "1.0.0",
    icon: Code2,
    primaryColor: "#bd93f9",
    bgColor: "#1a1b26",
    textColor: "#f8f8f2",
    gradient: "from-purple-400 via-indigo-600 to-slate-900"
  },
  {
    id: "abyssal-void",
    name: "Abyssal Void",
    category: "Dark & AMOLED",
    tagline: "Ultra-deep cosmic dark navy with subtle starlight lavender highlights.",
    badge: "Minimal",
    version: "1.0.0",
    icon: Boxes,
    primaryColor: "#818cf8",
    bgColor: "#020208",
    textColor: "#f1f5f9",
    gradient: "from-indigo-500 via-slate-800 to-black"
  },

  // Warm & Vibrant
  {
    id: "crimson-bloodline",
    name: "Crimson Bloodline",
    category: "Warm & Vibrant",
    tagline: "Aggressive, high-impact ruby red accents against pitch-black night.",
    badge: "Bold",
    version: "2.0.1",
    icon: Flame,
    primaryColor: "#f43f5e",
    bgColor: "#0d0205",
    textColor: "#fff1f2",
    gradient: "from-rose-600 via-red-700 to-neutral-950"
  },
  {
    id: "solar-amber",
    name: "Solar Amber",
    category: "Warm & Vibrant",
    tagline: "Radiant golden sunset flare over warm dark espresso undertones.",
    badge: "Warm",
    version: "1.1.4",
    icon: Sun,
    primaryColor: "#f59e0b",
    bgColor: "#0c0803",
    textColor: "#fffbeb",
    gradient: "from-amber-500 via-orange-600 to-zinc-950"
  },
  {
    id: "sunset-horizon",
    name: "Sunset Horizon",
    category: "Warm & Vibrant",
    tagline: "Vivid tropical mandarin orange with warm twilight shadows.",
    badge: "Vibrant",
    version: "1.0.2",
    icon: Compass,
    primaryColor: "#f97316",
    bgColor: "#0a0502",
    textColor: "#fff7ed",
    gradient: "from-orange-500 via-red-600 to-stone-950"
  },

  // Gaming & Esports
  {
    id: "netherite-flame",
    name: "Netherite Flame",
    category: "Gaming & Esports",
    tagline: "Minecraft Nether basalt obsidian with glowing blazing lava flare.",
    badge: "Gaming",
    version: "1.4.0",
    icon: Flame,
    primaryColor: "#ff5722",
    bgColor: "#0d0402",
    textColor: "#fff7ed",
    gradient: "from-orange-600 via-red-700 to-zinc-950"
  },
  {
    id: "cyberpunk-2077",
    name: "Cyberpunk 2077",
    category: "Gaming & Esports",
    tagline: "Electric Night City high-visibility yellow over dystopian black.",
    badge: "Sci-Fi",
    version: "2.0.0",
    icon: Cpu,
    primaryColor: "#facc15",
    bgColor: "#080803",
    textColor: "#fefce8",
    gradient: "from-yellow-400 via-amber-600 to-black"
  },
  {
    id: "radiant-emerald",
    name: "Radiant Esports",
    category: "Gaming & Esports",
    tagline: "Tournament-grade precision esports green with sharp carbon surfaces.",
    badge: "Competitive",
    version: "1.1.0",
    icon: Gamepad2,
    primaryColor: "#22c55e",
    bgColor: "#021207",
    textColor: "#f0fdf4",
    gradient: "from-green-500 via-emerald-700 to-slate-950"
  }
];

export default function AdminCustomization(): React.ReactElement {
  const { user } = useAuth();
  const { 
    panelLogo, panelBackgroundImage, panelBackgroundBlur, 
    themePrimaryColor, themeTextColor, themeBgColor,
    theme: activeThemeId,
    addons, setAddons,
    fetchSettings 
  } = useSettings();

  // Customization Top-Level Category Tab State
  const [activeMainCategory, setActiveMainCategory] = useState<"inbuilt-themes" | "custom-colors" | "branding" | "all">("inbuilt-themes");

  // Inbuilt Themes Sub-Category Filter State
  const [selectedThemeCategory, setSelectedThemeCategory] = useState<string>("ALL");
  const [themeSearchQuery, setThemeSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "grouped">("grid");
  const [previewTheme, setPreviewTheme] = useState<InbuiltTheme | null>(null);

  // Custom Colors & Assets State
  const [tempBgBlur, setTempBgBlur] = useState<number>(10);
  const [customBgUrlInput, setCustomBgUrlInput] = useState<string>("");
  const [primaryColor, setPrimaryColor] = useState<string>("");
  const [textColor, setTextColor] = useState<string>("");
  const [bgColor, setBgColor] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [croppingType, setCroppingType] = useState<"logo" | "background" | null>(null);
  const [bgAspectRatio, setBgAspectRatio] = useState<number>(16/9);

  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);

  // Theme Addon Status
  const isThemeAddonEnabled = addons?.theme?.enabled !== false;

  useEffect(() => {
    setCustomBgUrlInput(panelBackgroundImage || "");
    setTempBgBlur(panelBackgroundBlur || 0);
    setPrimaryColor(themePrimaryColor || "#6366f1");
    setTextColor(themeTextColor || "#ffffff");
    setBgColor(themeBgColor || "#030305");
  }, [panelBackgroundImage, panelBackgroundBlur, themePrimaryColor, themeTextColor, themeBgColor]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Toggle Theme Addon (turn on and turn off)
  const toggleThemeAddon = async () => {
    setIsProcessing(true);
    const newEnabled = !isThemeAddonEnabled;
    const newAddons = {
      ...(addons || {}),
      theme: {
        ...(addons?.theme || {}),
        enabled: newEnabled
      }
    };
    try {
      await axios.put("/api/system/settings", { addons: newAddons });
      setAddons(newAddons);
      showToast(newEnabled ? "Theme Addon turned ON" : "Theme Addon turned OFF");
    } catch (e) {
      showToast("Failed to toggle Theme addon", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered themes
  const filteredThemes = useMemo(() => {
    return INBUILT_THEMES.filter(theme => {
      const matchesCategory = selectedThemeCategory === "ALL" || theme.category === selectedThemeCategory;
      const matchesSearch = 
        theme.name.toLowerCase().includes(themeSearchQuery.toLowerCase()) ||
        theme.tagline.toLowerCase().includes(themeSearchQuery.toLowerCase()) ||
        theme.category.toLowerCase().includes(themeSearchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedThemeCategory, themeSearchQuery]);

  // Determine active theme
  const currentActiveTheme = useMemo(() => {
    const curP = (primaryColor || "").toLowerCase();
    const curB = (bgColor || "").toLowerCase();
    const curT = (textColor || "").toLowerCase();

    return INBUILT_THEMES.find(t => 
      t.primaryColor.toLowerCase() === curP &&
      t.bgColor.toLowerCase() === curB &&
      t.textColor.toLowerCase() === curT
    );
  }, [primaryColor, bgColor, textColor]);

  const currentActiveThemeId = currentActiveTheme ? currentActiveTheme.id : (activeThemeId || "custom");

  const handleApplyPresetTheme = async (preset: InbuiltTheme) => {
    setIsProcessing(true);
    setPrimaryColor(preset.primaryColor);
    setBgColor(preset.bgColor);
    setTextColor(preset.textColor);
    setPreviewTheme(null);

    // If theme addon is disabled, turn it on when applying a theme
    const newAddons = isThemeAddonEnabled ? addons : {
      ...(addons || {}),
      theme: {
        ...(addons?.theme || {}),
        enabled: true
      }
    };

    try {
      await axios.put("/api/system/settings", { 
        theme: preset.id,
        themePrimaryColor: preset.primaryColor,
        themeBgColor: preset.bgColor,
        themeTextColor: preset.textColor,
        addons: newAddons
      });
      if (!isThemeAddonEnabled) {
        setAddons(newAddons);
      }
      await fetchSettings();
      showToast(`Applied "${preset.name}" (${preset.category}) successfully!`);
    } catch (err: any) {
      showToast("Failed to apply theme.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // Turn on or turn off an individual theme from the grid
  const handleToggleTheme = async (theme: InbuiltTheme) => {
    const isCurrent = isThemeAddonEnabled && currentActiveThemeId === theme.id;
    if (isCurrent) {
      // Turning OFF: Revert to default Nova Classic
      const defaultTheme = INBUILT_THEMES[0];
      await handleApplyPresetTheme(defaultTheme);
      showToast(`Turned off "${theme.name}". Reverted to default.`);
    } else {
      // Turning ON: Activate this theme
      await handleApplyPresetTheme(theme);
    }
  };

  const handleFileChange = (e: any, type: "logo" | "background") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      showToast("File is too large (max 15MB).", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
      setCroppingType(type);
      if (type === "background") {
        const img = new Image();
        img.onload = () => {
          setBgAspectRatio(img.width / img.height);
        };
        img.src = reader.result as string;
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = async (croppedImageBase64: string) => {
    const type = croppingType;
    setSelectedImage(null);
    setCroppingType(null);

    setIsProcessing(true);
    try {
      if (type === "logo") {
        await axios.put("/api/system/settings", { panelLogo: croppedImageBase64 });
        showToast("Panel logo updated successfully.");
      } else if (type === "background") {
        await axios.put("/api/system/settings", { panelBackgroundImage: croppedImageBase64 });
        showToast("Background image updated.");
      }
      await fetchSettings();
    } catch (err: any) {
      showToast(`Failed to update ${type}.`, "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveColors = async () => {
    setIsProcessing(true);
    try {
      await axios.put("/api/system/settings", { 
        theme: "custom",
        themePrimaryColor: primaryColor,
        themeTextColor: textColor,
        themeBgColor: bgColor
      });
      await fetchSettings();
      showToast("Custom theme colors updated successfully.");
    } catch (err: any) {
      showToast("Failed to save colors.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetColors = async () => {
    const defaultTheme = INBUILT_THEMES[0];
    setIsProcessing(true);
    try {
      await axios.put("/api/system/settings", { 
        theme: defaultTheme.id,
        themePrimaryColor: defaultTheme.primaryColor,
        themeTextColor: defaultTheme.textColor,
        themeBgColor: defaultTheme.bgColor
      });
      setPrimaryColor(defaultTheme.primaryColor);
      setTextColor(defaultTheme.textColor);
      setBgColor(defaultTheme.bgColor);
      await fetchSettings();
      showToast("Theme reset to Nova Classic default.");
    } catch (err: any) {
      showToast("Failed to reset colors.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (user?.role !== "admin" && user?.role !== "owner") {
    return <div className="p-8 text-center text-red-500 font-semibold">Access Denied</div>;
  }

  // Active or previewed colors for interactive live card
  const activeP = previewTheme ? previewTheme.primaryColor : primaryColor;
  const activeB = previewTheme ? previewTheme.bgColor : bgColor;
  const activeT = previewTheme ? previewTheme.textColor : textColor;

  // Grouped themes
  const groupedThemes = useMemo(() => {
    const groups: Record<ThemeCategory, InbuiltTheme[]> = {
      "Classics": [],
      "Cyber & Neon": [],
      "Dark & AMOLED": [],
      "Warm & Vibrant": [],
      "Gaming & Esports": []
    };
    INBUILT_THEMES.forEach(t => {
      if (groups[t.category]) {
        groups[t.category].push(t);
      }
    });
    return groups;
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 pb-24 relative z-10"
    >
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border ${
              toastMessage.type === "success" 
                ? "bg-emerald-600 text-white border-emerald-400/40" 
                : "bg-red-600 text-white border-red-400/40"
            }`}
          >
            {toastMessage.type === "success" ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/70 backdrop-blur-xl border border-border-subtle p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-inner">
            <Palette className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Panel Customization
              </h1>
              {isThemeAddonEnabled && currentActiveTheme ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <Check size={12} /> {currentActiveTheme.name}
                </span>
              ) : isThemeAddonEnabled ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Custom Colors Active
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                  Theme Addon Disabled
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Choose from prebuilt inbuilt theme categories, toggle themes on or off, and configure branding logos and wallpapers.
            </p>
          </div>
        </div>
      </div>

      {/* MASTER THEME ADDON TOGGLE BAR */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#12131a] border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
            <Palette size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-foreground">Theme</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                addon: theme
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isThemeAddonEnabled ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
              }`}>
                {isThemeAddonEnabled ? "Turned On" : "Turned Off"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Master toggle for custom themes and aesthetic palettes panel-wide. Managed under Addons.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link 
            to="/admin/addons" 
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
          >
            <span>Manage in Addons</span>
            <ExternalLink size={12} />
          </Link>
          <button
            type="button"
            onClick={toggleThemeAddon}
            disabled={isProcessing}
            title={isThemeAddonEnabled ? "Turn Off Theme Addon" : "Turn On Theme Addon"}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              isThemeAddonEnabled ? "bg-purple-600 shadow-md shadow-purple-600/30" : "bg-white/10 border border-white/10"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                isThemeAddonEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* WARNING IF THEME ADDON IS DISABLED */}
      {!isThemeAddonEnabled && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-4 text-xs text-amber-300">
          <div className="flex items-center gap-2.5">
            <AlertCircle size={18} className="text-amber-400 shrink-0" />
            <span>The <strong>Theme</strong> addon is currently turned off. Inbuilt themes and custom styling are deactivated across the panel.</span>
          </div>
          <button
            onClick={toggleThemeAddon}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold whitespace-nowrap transition-colors"
          >
            Turn On Theme Addon
          </button>
        </div>
      )}

      {/* CUSTOMIZATION MAIN CATEGORY NAVIGATION BAR */}
      <div className="flex items-center gap-2 overflow-x-auto p-1.5 bg-card/60 backdrop-blur-md rounded-2xl border border-border-subtle no-scrollbar">
        <button
          onClick={() => setActiveMainCategory("inbuilt-themes")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeMainCategory === "inbuilt-themes"
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Sparkles size={16} />
          <span>Inbuilt Themes</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
            activeMainCategory === "inbuilt-themes" ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
          }`}>
            {INBUILT_THEMES.length}
          </span>
        </button>

        <button
          onClick={() => setActiveMainCategory("custom-colors")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeMainCategory === "custom-colors"
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Sliders size={16} />
          <span>Color Tuning</span>
        </button>

        <button
          onClick={() => setActiveMainCategory("branding")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeMainCategory === "branding"
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <ImageIcon size={16} />
          <span>Logo & Wallpaper</span>
        </button>

        <button
          onClick={() => setActiveMainCategory("all")}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm transition-all whitespace-nowrap ${
            activeMainCategory === "all"
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <Layers size={16} />
          <span>All Customization</span>
        </button>
      </div>

      {/* CATEGORY: INBUILT THEMES (SCREENSHOT BLUEPRINT UI) */}
      {(activeMainCategory === "inbuilt-themes" || activeMainCategory === "all") && (
        <div className="space-y-6">
          
          {/* Category Cards Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(Object.keys(CATEGORY_INFO) as ThemeCategory[]).map((catKey) => {
              const info = CATEGORY_INFO[catKey];
              const IconComp = info.icon;
              const count = INBUILT_THEMES.filter(t => t.category === catKey).length;
              const isSelected = selectedThemeCategory === catKey;

              return (
                <button
                  key={catKey}
                  onClick={() => setSelectedThemeCategory(isSelected ? "ALL" : catKey)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all group ${
                    isSelected 
                      ? "border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/40" 
                      : "border-border-subtle bg-card/70 hover:border-border hover:bg-muted/70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-xl border ${info.bg} ${info.color}`}>
                      <IconComp size={16} />
                    </div>
                    <span className="text-xs font-mono font-bold text-muted-foreground">
                      {count}
                    </span>
                  </div>
                  <div>
                    <h3 className={`font-bold text-xs sm:text-sm ${isSelected ? "text-indigo-400" : "text-foreground group-hover:text-indigo-300"}`}>
                      {catKey}
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      {info.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Inbuilt Themes Main Showcase Container */}
          <div className="bg-card/80 backdrop-blur-xl border border-border-subtle rounded-3xl p-5 sm:p-7 shadow-xl space-y-6">
            
            {/* Controls Header: Category Filter Pills, Search, View Mode Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-subtle pb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                    Inbuilt Theme Gallery
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {filteredThemes.length} of {INBUILT_THEMES.length}
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Blueprint style extension cards. Use the option toggle on each theme to turn on or turn off.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-60">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input 
                    type="text"
                    placeholder="Search themes..."
                    value={themeSearchQuery}
                    onChange={(e) => setThemeSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-black/40 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500/50 transition-colors"
                  />
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center bg-muted border border-border-subtle rounded-xl p-1 shrink-0">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-indigo-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    title="Grid View"
                  >
                    <Grid size={15} />
                  </button>
                  <button
                    onClick={() => setViewMode("grouped")}
                    className={`p-1.5 rounded-lg transition-colors ${viewMode === "grouped" ? "bg-indigo-500 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    title="Grouped by Category"
                  >
                    <ListFilter size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Pills Bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedThemeCategory("ALL")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  selectedThemeCategory === "ALL" 
                    ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted-hover border border-border-subtle"
                }`}
              >
                All Themes ({INBUILT_THEMES.length})
              </button>

              {(Object.keys(CATEGORY_INFO) as ThemeCategory[]).map((cat) => {
                const count = INBUILT_THEMES.filter(t => t.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedThemeCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                      selectedThemeCategory === cat 
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" 
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted-hover border border-border-subtle"
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>

            {/* THEMES GRID: BLUEPRINT / EXTENSION STYLE AS REQUESTED */}
            {viewMode === "grid" || selectedThemeCategory !== "ALL" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredThemes.map((theme) => {
                  const isCurrent = isThemeAddonEnabled && currentActiveThemeId === theme.id;
                  const IconComp = theme.icon || Sparkles;

                  return (
                    <motion.div
                      key={theme.id}
                      whileHover={{ y: -2 }}
                      transition={{ duration: 0.15 }}
                      onMouseEnter={() => setPreviewTheme(theme)}
                      onMouseLeave={() => setPreviewTheme(null)}
                      className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 select-none ${
                        isCurrent
                          ? "bg-[#161822] border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                          : "bg-[#12131a] hover:bg-[#181924] border-white/5 hover:border-white/15"
                      }`}
                    >
                      {/* Left Square Glowing Icon */}
                      <div 
                        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md relative overflow-hidden transition-transform group-hover:scale-105"
                        style={{
                          background: `linear-gradient(135deg, ${theme.primaryColor}33, ${theme.primaryColor}15)`,
                          border: `1px solid ${theme.primaryColor}44`,
                          boxShadow: isCurrent ? `0 0 16px ${theme.primaryColor}40` : `0 0 8px ${theme.primaryColor}20`
                        }}
                      >
                        <IconComp size={20} style={{ color: theme.primaryColor }} />
                      </div>

                      {/* Middle Text: Title + Version */}
                      <div className="flex-1 min-w-0 px-2.5">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                            {theme.name}
                          </h4>
                        </div>
                        <p className="text-[11px] text-muted-foreground/80 font-mono truncate mt-0.5 flex items-center gap-1">
                          <span>{theme.version || "1.0.0"}</span>
                          <span className="opacity-40">•</span>
                          <span className="truncate">{isCurrent ? "Active" : theme.category}</span>
                        </p>
                      </div>

                      {/* Right Controls: Option Toggle (Turn ON / Turn OFF) + Arrow */}
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTheme(theme);
                          }}
                          disabled={isProcessing}
                          title={isCurrent ? `Turn OFF ${theme.name}` : `Turn ON ${theme.name}`}
                          className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none ${
                            isCurrent 
                              ? "bg-indigo-500 shadow-md shadow-indigo-500/30" 
                              : "bg-white/10 hover:bg-white/20 border border-white/10"
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                              isCurrent ? "translate-x-4 sm:translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>

                        <button
                          type="button"
                          onClick={() => setPreviewTheme(theme)}
                          className="text-muted-foreground/50 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                          title="Inspect & Preview"
                        >
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}

                {/* + Card matching screenshot bottom right */}
                <button
                  type="button"
                  onClick={() => setActiveMainCategory("custom-colors")}
                  className="flex items-center justify-center p-3.5 rounded-2xl border border-dashed border-white/10 hover:border-white/30 bg-[#12131a]/50 hover:bg-[#181924] text-muted-foreground hover:text-white transition-all min-h-[64px] group"
                  title="Create or Tune Custom Theme"
                >
                  <div className="w-8 h-8 rounded-lg bg-white/5 group-hover:bg-white/10 flex items-center justify-center text-muted-foreground group-hover:text-white transition-colors">
                    <Plus size={18} />
                  </div>
                </button>
              </div>
            ) : (
              // Grouped by Category View in Blueprint UI
              <div className="space-y-8">
                {(Object.keys(groupedThemes) as ThemeCategory[]).map((categoryName) => {
                  const catThemes = groupedThemes[categoryName];
                  const info = CATEGORY_INFO[categoryName];
                  const IconComp = info.icon;

                  return (
                    <div key={categoryName} className="space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
                        <div className="flex items-center gap-2.5">
                          <div className={`p-1.5 rounded-lg border ${info.bg} ${info.color}`}>
                            <IconComp size={15} />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                              {categoryName}
                              <span className="text-[11px] font-normal text-muted-foreground">({catThemes.length})</span>
                            </h3>
                          </div>
                        </div>
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {info.desc}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {catThemes.map((theme) => {
                          const isCurrent = isThemeAddonEnabled && currentActiveThemeId === theme.id;
                          const CardIcon = theme.icon || Sparkles;

                          return (
                            <motion.div
                              key={theme.id}
                              whileHover={{ y: -2 }}
                              transition={{ duration: 0.15 }}
                              onMouseEnter={() => setPreviewTheme(theme)}
                              onMouseLeave={() => setPreviewTheme(null)}
                              className={`group relative flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 select-none ${
                                isCurrent 
                                  ? "bg-[#161822] border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30" 
                                  : "bg-[#12131a] hover:bg-[#181924] border-white/5 hover:border-white/15"
                              }`}
                            >
                              <div 
                                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-md relative overflow-hidden transition-transform group-hover:scale-105"
                                style={{
                                  background: `linear-gradient(135deg, ${theme.primaryColor}33, ${theme.primaryColor}15)`,
                                  border: `1px solid ${theme.primaryColor}44`,
                                  boxShadow: isCurrent ? `0 0 16px ${theme.primaryColor}40` : `0 0 8px ${theme.primaryColor}20`
                                }}
                              >
                                <CardIcon size={20} style={{ color: theme.primaryColor }} />
                              </div>

                              <div className="flex-1 min-w-0 px-2.5">
                                <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">{theme.name}</h4>
                                <p className="text-[11px] text-muted-foreground/80 font-mono truncate mt-0.5 flex items-center gap-1">
                                  <span>{theme.version || "1.0.0"}</span>
                                  <span className="opacity-40">•</span>
                                  <span className="truncate">{isCurrent ? "Active" : theme.category}</span>
                                </p>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleTheme(theme);
                                  }}
                                  disabled={isProcessing}
                                  title={isCurrent ? `Turn OFF ${theme.name}` : `Turn ON ${theme.name}`}
                                  className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-colors focus:outline-none ${
                                    isCurrent 
                                      ? "bg-indigo-500 shadow-md shadow-indigo-500/30" 
                                      : "bg-white/10 hover:bg-white/20 border border-white/10"
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-3.5 w-3.5 sm:h-4 sm:w-4 transform rounded-full bg-white transition-transform ${
                                      isCurrent ? "translate-x-4 sm:translate-x-6" : "translate-x-1"
                                    }`}
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setPreviewTheme(theme)}
                                  className="text-muted-foreground/50 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                                >
                                  <ArrowRight size={14} />
                                </button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LIVE PREVIEW & FINE-TUNING GRID */}
      {(activeMainCategory === "custom-colors" || activeMainCategory === "inbuilt-themes" || activeMainCategory === "all") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Live Mockup Preview Box */}
          <div className="lg:col-span-5 bg-card/80 backdrop-blur-xl border border-border-subtle rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Eye className="w-5 h-5 text-indigo-400" /> Live Theme Preview
                </h2>
                {previewTheme && (
                  <span className="text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                    Previewing: {previewTheme.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Interactive preview demonstrating active buttons, status badges, typography, and card contrast in real time.
              </p>

              {/* Mock Dashboard Card */}
              <div 
                className="p-5 rounded-2xl border border-border transition-all duration-300 shadow-2xl relative overflow-hidden"
                style={{ backgroundColor: activeB, color: activeT }}
              >
                {/* Header Mock */}
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div 
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-md"
                      style={{ backgroundColor: activeP }}
                    >
                      N
                    </div>
                    <span className="font-bold text-sm tracking-tight">Nova Server #01</span>
                  </div>
                  <div 
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-white/10"
                    style={{ color: activeP }}
                  >
                    Running
                  </div>
                </div>

                {/* Metrics Mock */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-1.5 text-[10px] opacity-70 mb-1">
                      <Activity size={12} style={{ color: activeP }} /> CPU Load
                    </div>
                    <div className="text-sm font-bold font-mono">14.2%</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-1.5 text-[10px] opacity-70 mb-1">
                      <Server size={12} style={{ color: activeP }} /> Memory
                    </div>
                    <div className="text-sm font-bold font-mono">3.8 / 8 GB</div>
                  </div>
                </div>

                {/* Action Buttons Mock */}
                <div className="flex items-center gap-2">
                  <div 
                    className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-white text-center shadow-md flex items-center justify-center gap-1.5"
                    style={{ backgroundColor: activeP }}
                  >
                    <Terminal size={12} /> Console
                  </div>
                  <div className="py-2 px-3 rounded-xl text-xs font-medium bg-white/10 text-center border border-white/10">
                    Settings
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-2 text-[11px] text-muted-foreground/80 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-400" />
              <span>Hover over any theme in the inbuilt theme gallery to test it live here.</span>
            </div>
          </div>

          {/* Custom Fine-Tuning Section */}
          <div className="lg:col-span-7 bg-card/80 backdrop-blur-xl border border-border-subtle hover:border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-400" /> Custom Color Tuning
                </h2>
                <span className="text-xs text-muted-foreground">Manual Hex Values</span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Fine-tune color codes to craft your own custom brand identity. Changes apply immediately upon saving.
              </p>

              <div className="space-y-4">
                {/* Primary Accent */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-muted-subtle border border-border-subtle">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-foreground">Primary Accent</label>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                    </div>
                    <p className="text-xs text-muted-foreground">Used on buttons, active links, glow rings, and key metrics.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={primaryColor} 
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-24 px-2 py-1.5 bg-black/50 border border-border rounded-lg text-xs font-mono text-center text-foreground"
                      placeholder="#6366f1"
                    />
                    <input 
                      type="color" 
                      value={primaryColor || "#6366f1"} 
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-9 bg-transparent border-0 rounded-lg cursor-pointer" 
                    />
                  </div>
                </div>

                {/* Background Color */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-muted-subtle border border-border-subtle">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-foreground">Background Color</label>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bgColor }} />
                    </div>
                    <p className="text-xs text-muted-foreground">Used as the main panel foundation and component surface base.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={bgColor} 
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-24 px-2 py-1.5 bg-black/50 border border-border rounded-lg text-xs font-mono text-center text-foreground"
                      placeholder="#030305"
                    />
                    <input 
                      type="color" 
                      value={bgColor || "#030305"} 
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-10 h-9 bg-transparent border-0 rounded-lg cursor-pointer" 
                    />
                  </div>
                </div>

                {/* Text Color */}
                <div className="flex items-center justify-between gap-4 p-3 rounded-2xl bg-muted-subtle border border-border-subtle">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-bold text-foreground">Text & Headings Color</label>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: textColor }} />
                    </div>
                    <p className="text-xs text-muted-foreground">Used across primary titles, headers, and high-contrast typography.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={textColor} 
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-24 px-2 py-1.5 bg-black/50 border border-border rounded-lg text-xs font-mono text-center text-foreground"
                      placeholder="#ffffff"
                    />
                    <input 
                      type="color" 
                      value={textColor || "#ffffff"} 
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-10 h-9 bg-transparent border-0 rounded-lg cursor-pointer" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle flex gap-3">
              <button 
                onClick={handleSaveColors}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition-all shadow-md shadow-indigo-500/20 text-sm disabled:opacity-50"
              >
                <Check size={16} />
                {isProcessing ? "Saving Colors..." : "Save Custom Colors"}
              </button>
              <button 
                onClick={handleResetColors}
                disabled={isProcessing}
                className="px-4 flex items-center gap-2 bg-muted hover:bg-muted-hover text-foreground border border-border font-medium py-2.5 rounded-xl transition-all text-sm disabled:opacity-50"
                title="Reset to Nova Classic"
              >
                <RotateCcw size={15} />
                Reset Default
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BRANDING ASSETS: LOGO & BACKGROUND */}
      {(activeMainCategory === "branding" || activeMainCategory === "all") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Logo Section */}
          <div className="bg-card/80 backdrop-blur-xl border border-border-subtle hover:border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Panel Logo</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Replace the default Nova logo in the top bar, favicon, and mobile viewports.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-4">
                <div className="w-20 h-20 rounded-2xl bg-muted border border-border-subtle flex items-center justify-center overflow-hidden flex-shrink-0 relative group shadow-inner">
                  {panelLogo ? (
                    <img src={panelLogo} alt="Panel Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Layout className="w-8 h-8 text-muted-foreground/50" />
                  )}
                  {panelLogo && (
                    <button 
                      onClick={async () => {
                        try {
                          await axios.put("/api/system/settings", { panelLogo: "" });
                          await fetchSettings();
                          showToast("Logo removed.");
                        } catch(e) {}
                      }}
                      className="absolute inset-0 bg-red-500/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                      title="Remove logo"
                    >
                      <Trash2 size={20} className="text-white" />
                    </button>
                  )}
                </div>
                
                <div className="flex-1 w-full text-center sm:text-left space-y-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={logoFileInputRef}
                    onChange={(e: any) => handleFileChange(e, "logo")}
                  />
                  <button 
                    disabled={isProcessing}
                    onClick={() => logoFileInputRef.current?.click()}
                    className="inline-flex items-center justify-center gap-2 bg-muted hover:bg-muted-hover text-foreground border border-border font-medium px-4 py-2.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 w-full sm:w-auto text-sm"
                  >
                    <Upload size={16} />
                    {isProcessing ? "Processing..." : (panelLogo ? "Replace Logo" : "Upload Logo")}
                  </button>
                  <p className="text-xs text-muted-foreground">Square image recommended (PNG, SVG, or JPG). At least 256x256px.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Background Section */}
          <div className="bg-card/80 backdrop-blur-xl border border-border-subtle hover:border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-1">Custom Background</h2>
              <p className="text-xs text-muted-foreground mb-4">
                Apply a custom wallpaper behind the dashboard with adjustable Gaussian blur.
              </p>

              <div className="w-full h-32 rounded-xl bg-slate-900 border border-border flex items-center justify-center overflow-hidden relative group mb-4">
                {panelBackgroundImage ? (
                  <img src={panelBackgroundImage} alt="Dashboard Background" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                    <Layout className="w-8 h-8 opacity-60" />
                    <span className="text-xs">Default Animated Mesh Gradient</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  ref={bgFileInputRef}
                  onChange={(e) => handleFileChange(e, "background")}
                />
                <div className="flex gap-2">
                  <button 
                    disabled={isProcessing}
                    onClick={() => bgFileInputRef.current?.click()}
                    className="flex-1 flex items-center justify-center gap-2 bg-muted hover:bg-muted-hover text-foreground border border-border font-medium px-3 py-2 rounded-xl transition-all shadow-sm text-sm"
                  >
                    <Upload size={16} /> Upload Image
                  </button>
                  {panelBackgroundImage && (
                    <button 
                      onClick={async () => {
                        setIsProcessing(true);
                        try {
                          await axios.put("/api/system/settings", { panelBackgroundImage: "" });
                          setCustomBgUrlInput("");
                          await fetchSettings();
                          showToast("Background removed.");
                        } catch(e) {} finally {
                          setIsProcessing(false);
                        }
                      }}
                      className="flex items-center justify-center gap-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-medium px-3 py-2 rounded-xl transition-all shadow-sm text-sm border border-red-500/30"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span className="font-medium">Background Blur</span>
                    <span className="font-mono">{tempBgBlur}px</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={tempBgBlur}
                    onChange={(e: any) => setTempBgBlur(Number(e.target.value))}
                    onMouseUp={async () => {
                      setIsProcessing(true);
                      try {
                        await axios.put("/api/system/settings", { panelBackgroundBlur: tempBgBlur });
                        await fetchSettings();
                      } catch(e) {} finally {
                        setIsProcessing(false);
                      }
                    }}
                    onTouchEnd={async () => {
                      setIsProcessing(true);
                      try {
                        await axios.put("/api/system/settings", { panelBackgroundBlur: tempBgBlur });
                        await fetchSettings();
                      } catch(e) {} finally {
                        setIsProcessing(false);
                      }
                    }}
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedImage && (
        <ImageCropper
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => { setSelectedImage(null); setCroppingType(null); }}
          aspectRatio={croppingType === "background" ? bgAspectRatio : 1}
          title={croppingType === "background" ? "Crop Background" : "Crop Logo"}
        />
      )}
    </motion.div>
  );
}
