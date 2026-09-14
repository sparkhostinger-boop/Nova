// @ts-nocheck
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";
import { Layout, Palette, Upload, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { ImageCropper } from "../components/ImageCropper";

export default function AdminCustomization(): React.ReactElement {
  const { user } = useAuth();
  const { 
    panelLogo, panelBackgroundImage, panelBackgroundBlur, 
    themePrimaryColor, themeTextColor, themeBgColor,
    fetchSettings 
  } = useSettings();

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

  useEffect(() => {
    setCustomBgUrlInput(panelBackgroundImage || "");
    setTempBgBlur(panelBackgroundBlur || 0);
    setPrimaryColor(themePrimaryColor || "");
    setTextColor(themeTextColor || "");
    setBgColor(themeBgColor || "");
  }, [panelBackgroundImage, panelBackgroundBlur, themePrimaryColor, themeTextColor, themeBgColor]);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
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
        themePrimaryColor: primaryColor,
        themeTextColor: textColor,
        themeBgColor: bgColor
      });
      await fetchSettings();
      showToast("Theme colors updated successfully.");
    } catch (err: any) {
      showToast("Failed to save colors.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetColors = async () => {
    setIsProcessing(true);
    try {
      await axios.put("/api/system/settings", { 
        themePrimaryColor: "",
        themeTextColor: "",
        themeBgColor: ""
      });
      setPrimaryColor("");
      setTextColor("");
      setBgColor("");
      await fetchSettings();
      showToast("Theme colors reset to default.");
    } catch (err: any) {
      showToast("Failed to reset colors.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (user?.role !== "admin" && user?.role !== "owner") {
    return <div className="p-8 text-center text-red-500">Access Denied</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-20 relative z-10"
    >
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/70 backdrop-blur-xl border border-border-subtle p-6 rounded-3xl shadow-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30 shadow-inner">
            <Palette className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
              Panel Customization
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Customize the look and feel of your Nova Panel, including colors, logos, and backgrounds.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Colors Section */}
        <div className="bg-card/80 backdrop-blur-xl border border-border-subtle hover:border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all group">
          <div>
            <h2 className="text-lg font-bold text-foreground mb-4">Theme Colors</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-foreground">Primary Accent</label>
                  <p className="text-xs text-muted-foreground">Buttons, highlights, active states.</p>
                </div>
                <input 
                  type="color" 
                  value={primaryColor || "#4f46e5"} 
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-14 h-10 bg-transparent border-0 rounded cursor-pointer" 
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-foreground">Background Color</label>
                  <p className="text-xs text-muted-foreground">Main panel background & cards.</p>
                </div>
                <input 
                  type="color" 
                  value={bgColor || "#030305"} 
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-14 h-10 bg-transparent border-0 rounded cursor-pointer" 
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-foreground">Text Color</label>
                  <p className="text-xs text-muted-foreground">Primary text and headings.</p>
                </div>
                <input 
                  type="color" 
                  value={textColor || "#ffffff"} 
                  onChange={(e) => setTextColor(e.target.value)}
                  className="w-14 h-10 bg-transparent border-0 rounded cursor-pointer" 
                />
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-border-subtle flex gap-2">
            <button 
              onClick={handleSaveColors}
              disabled={isProcessing}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-xl transition-all shadow-sm text-sm"
            >
              {isProcessing ? "Saving..." : "Save Colors"}
            </button>
            <button 
              onClick={handleResetColors}
              disabled={isProcessing}
              className="px-4 bg-muted hover:bg-muted-hover text-foreground border border-border font-medium py-2 rounded-xl transition-all shadow-sm text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Logo Section */}
          <div className="bg-card/80 backdrop-blur-xl border border-border-subtle hover:border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all group">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Panel Logo</h2>
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
                    className="inline-flex items-center justify-center gap-2 bg-muted hover:bg-muted-hover text-foreground border border-border font-medium px-4 py-2 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 w-full sm:w-auto"
                  >
                    <Upload size={16} />
                    {isProcessing ? "Processing..." : (panelLogo ? "Replace Logo" : "Upload Logo")}
                  </button>
                  <p className="text-xs text-muted-foreground">We recommend a square image, PNG or JPG format, at least 256x256px for a perfect fit.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Background Section */}
          <div className="bg-card/80 backdrop-blur-xl border border-border-subtle hover:border-border rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-4 transition-all group">
            <div>
              <h2 className="text-lg font-bold text-foreground mb-4">Custom Background</h2>
              <div className="w-full h-32 rounded-xl bg-slate-900 border border-border flex items-center justify-center overflow-hidden relative group mb-4">
                {panelBackgroundImage ? (
                  <img src={panelBackgroundImage} alt="Dashboard Background" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                    <Layout className="w-8 h-8 opacity-60" />
                    <span className="text-xs">Default Animated Gradient</span>
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
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Background Blur ({tempBgBlur}px)</label>
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
                    className="w-full accent-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
