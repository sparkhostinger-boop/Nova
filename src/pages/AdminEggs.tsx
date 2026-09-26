// @ts-nocheck
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import {
  Egg,
  Plus,
  Upload,
  Search,
  Trash2,
  Edit2,
  Download,
  Terminal,
  Server,
  Layers,
  Check,
  Copy,
  AlertCircle,
  FileCode,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Code2,
  Hash,
  Globe,
  Tag,
  Boxes
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface SoftwareEgg {
  id: string;
  name: string;
  type?: string; // e.g. "BETA", "STABLE"
  category: string;
  author: string;
  description: string;
  dockerImage: string;
  startupCommand: string;
  stopCommand: string;
  defaultPort: number;
  mountDir: string;
  versions: string[];
  variables?: {
    name: string;
    env_variable: string;
    default_value: string;
    description?: string;
  }[];
  custom: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminEggs() {
  const navigate = useNavigate();
  const [eggs, setEggs] = useState<SoftwareEgg[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Toast / Status Message
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEgg, setEditingEgg] = useState<SoftwareEgg | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [versionModalEgg, setVersionModalEgg] = useState<SoftwareEgg | null>(null);
  const [deletingEgg, setDeletingEgg] = useState<SoftwareEgg | null>(null);

  // Create / Edit Form State
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("BETA");
  const [formCategory, setFormCategory] = useState("Minecraft Java");
  const [formCustomCategory, setFormCustomCategory] = useState("");
  const [formAuthor, setFormAuthor] = useState("Nova Admin");
  const [formDescription, setFormDescription] = useState("");
  const [formDockerImage, setFormDockerImage] = useState("itzg/minecraft-server:latest");
  const [formStartupCommand, setFormStartupCommand] = useState("java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar --nogui");
  const [formStopCommand, setFormStopCommand] = useState("stop");
  const [formDefaultPort, setFormDefaultPort] = useState("25565");
  const [formMountDir, setFormMountDir] = useState("/data");
  const [formVersionsText, setFormVersionsText] = useState("latest, 1.21.1, 1.20.4");
  const [formVariables, setFormVariables] = useState<Array<{ name: string; env_variable: string; default_value: string; description: string }>>([]);

  // Import JSON Modal State
  const [importJsonText, setImportJsonText] = useState("");
  const [importFileName, setImportFileName] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Versions Modal State
  const [newVersionInput, setNewVersionInput] = useState("");
  const [bulkVersionsText, setBulkVersionsText] = useState("");

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchEggs = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/eggs");
      setEggs(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to load software eggs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEggs();
  }, []);

  const categories = ["ALL", ...Array.from(new Set(eggs.map(e => e.category || "Custom")))];

  const filteredEggs = eggs.filter(egg => {
    const matchesSearch = 
      egg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      egg.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      egg.dockerImage.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (egg.category && egg.category.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === "ALL" || egg.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openCreateModal = () => {
    setEditingEgg(null);
    setFormName("");
    setFormType("BETA");
    setFormCategory("Minecraft Java");
    setFormCustomCategory("");
    setFormAuthor("Nova Admin");
    setFormDescription("");
    setFormDockerImage("itzg/minecraft-server:latest");
    setFormStartupCommand("java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar --nogui");
    setFormStopCommand("stop");
    setFormDefaultPort("25565");
    setFormMountDir("/data");
    setFormVersionsText("latest, 1.21.1, 1.20.4");
    setFormVariables([
      { name: "Server Jar", env_variable: "SERVER_JARFILE", default_value: "server.jar", description: "Name of the executable jar" }
    ]);
    setShowCreateModal(true);
  };

  const openEditModal = (egg: SoftwareEgg) => {
    setEditingEgg(egg);
    setFormName(egg.name);
    setFormType(egg.type || "BETA");
    setFormCategory(egg.category);
    setFormCustomCategory("");
    setFormAuthor(egg.author || "");
    setFormDescription(egg.description || "");
    setFormDockerImage(egg.dockerImage);
    setFormStartupCommand(egg.startupCommand || "");
    setFormStopCommand(egg.stopCommand || "stop");
    setFormDefaultPort(String(egg.defaultPort || 25565));
    setFormMountDir(egg.mountDir || "/data");
    setFormVersionsText(egg.versions ? egg.versions.join(", ") : "");
    setFormVariables(egg.variables ? [...egg.variables] : []);
    setShowCreateModal(true);
  };

  const handleSaveEgg = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = formCategory === "CUSTOM" && formCustomCategory ? formCustomCategory : formCategory;
    const versionsArray = formVersionsText
      .split(/[\n,]+/)
      .map(v => v.trim())
      .filter(Boolean);

    const payload = {
      name: formName,
      type: formType || "BETA",
      category: finalCategory,
      author: formAuthor,
      description: formDescription,
      dockerImage: formDockerImage,
      startupCommand: formStartupCommand,
      stopCommand: formStopCommand,
      defaultPort: Number(formDefaultPort),
      mountDir: formMountDir,
      versions: versionsArray.length > 0 ? versionsArray : ["latest"],
      variables: formVariables
    };

    try {
      if (editingEgg) {
        await axios.put(`/api/eggs/${editingEgg.id}`, payload);
        showToast(`Egg "${formName}" updated successfully!`);
      } else {
        await axios.post("/api/eggs", payload);
        showToast(`Egg "${formName}" created successfully!`);
      }
      setShowCreateModal(false);
      fetchEggs();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to save egg", "error");
    }
  };

  const handleDeleteEgg = async () => {
    if (!deletingEgg) return;
    try {
      await axios.delete(`/api/eggs/${deletingEgg.id}`);
      showToast(`Egg "${deletingEgg.name}" deleted`);
      setDeletingEgg(null);
      fetchEggs();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to delete egg", "error");
    }
  };

  const handleExportJson = (egg: SoftwareEgg) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(egg, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `egg-${egg.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast(`Exported "${egg.name}" as JSON!`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        // Verify valid JSON
        JSON.parse(text);
        setImportJsonText(text);
      } catch (err) {
        setImportError("Selected file is not valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);
    if (!importJsonText.trim()) {
      setImportError("Please provide JSON data or select a JSON file.");
      return;
    }

    try {
      const parsed = JSON.parse(importJsonText);
      const res = await axios.post("/api/eggs/import", parsed);
      showToast(`Successfully imported ${res.data.importedCount || 1} software egg(s)!`);
      setShowImportModal(false);
      setImportJsonText("");
      setImportFileName("");
      fetchEggs();
    } catch (err: any) {
      setImportError(err.response?.data?.error || err.message || "Import failed");
    }
  };

  const handleResetPresets = async () => {
    if (!confirm("Reset eggs list to default preset templates? This will restore standard community eggs.")) return;
    try {
      await axios.post("/api/eggs/presets/reset");
      showToast("Restored default preset software eggs!");
      fetchEggs();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to reset presets", "error");
    }
  };

  // Add single version
  const handleAddVersion = async () => {
    if (!versionModalEgg || !newVersionInput.trim()) return;
    try {
      const res = await axios.post(`/api/eggs/${versionModalEgg.id}/versions`, {
        version: newVersionInput.trim()
      });
      setVersionModalEgg(prev => prev ? { ...prev, versions: res.data.versions } : null);
      setNewVersionInput("");
      showToast("Version added!");
      fetchEggs();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to add version", "error");
    }
  };

  // Import bulk versions
  const handleImportBulkVersions = async () => {
    if (!versionModalEgg || !bulkVersionsText.trim()) return;
    try {
      const res = await axios.post(`/api/eggs/${versionModalEgg.id}/versions`, {
        versions: bulkVersionsText
      });
      setVersionModalEgg(prev => prev ? { ...prev, versions: res.data.versions } : null);
      setBulkVersionsText("");
      showToast("Imported new versions!");
      fetchEggs();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to import versions", "error");
    }
  };

  // Delete single version
  const handleDeleteVersion = async (ver: string) => {
    if (!versionModalEgg) return;
    try {
      const res = await axios.delete(`/api/eggs/${versionModalEgg.id}/versions/${encodeURIComponent(ver)}`);
      setVersionModalEgg(prev => prev ? { ...prev, versions: res.data.versions } : null);
      showToast(`Removed version ${ver}`);
      fetchEggs();
    } catch (err: any) {
      showToast(err.response?.data?.error || "Failed to remove version", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-2xl border flex items-center gap-3 text-sm font-medium ${
              toast.type === "success"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 backdrop-blur-xl"
                : "bg-red-500/10 text-red-400 border-red-500/20 backdrop-blur-xl"
            }`}
          >
            {toast.type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-card to-card/60 border border-border-subtle p-6 rounded-2xl shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Egg className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Software Eggs</h1>
            <span className="text-xs bg-amber-500/20 text-amber-500 dark:text-amber-400 font-bold px-2 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">
              BETA
            </span>
            <span className="text-xs bg-indigo-500/20 text-indigo-400 font-semibold px-2.5 py-0.5 rounded-full border border-indigo-500/30">
              Engines & Images
            </span>
          </div>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Upload custom software eggs, configure Docker images, startup flags, and manage software versions for games, Discord bots, and apps.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Egg</span>
          </button>
          <button
            onClick={() => {
              setImportJsonText("");
              setImportFileName("");
              setImportError(null);
              setShowImportModal(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border hover:bg-muted text-foreground text-sm font-medium rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Upload size={16} className="text-indigo-400" />
            <span>Import Egg (JSON)</span>
          </button>
          <button
            onClick={handleResetPresets}
            title="Reset eggs to defaults"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-xl transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card p-4 rounded-xl border border-border-subtle shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <Boxes className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Eggs</p>
            <p className="text-lg font-bold text-foreground">{eggs.length}</p>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border-subtle shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Custom Eggs</p>
            <p className="text-lg font-bold text-foreground">{eggs.filter(e => e.custom).length}</p>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border-subtle shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Categories</p>
            <p className="text-lg font-bold text-foreground">{categories.length - 1}</p>
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border-subtle shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Versions</p>
            <p className="text-lg font-bold text-foreground">
              {eggs.reduce((acc, curr) => acc + (curr.versions?.length || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search software eggs, images, tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 shadow-inner"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 max-w-full custom-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {cat === "ALL" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Eggs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-card border border-border-subtle p-5 rounded-2xl animate-pulse h-64" />
          ))}
        </div>
      ) : filteredEggs.length === 0 ? (
        <div className="bg-card border border-border-subtle rounded-2xl p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
            <Egg className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">No Software Eggs Found</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6">
            {searchTerm || selectedCategory !== "ALL"
              ? "No software eggs matched your search criteria. Try a different query or category."
              : "No eggs currently configured. Create a new custom egg or import a community egg JSON."}
          </p>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>Create New Egg</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEggs.map((egg) => (
            <motion.div
              key={egg.id}
              layout
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
              className="bg-card border border-border-subtle rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-border relative"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {egg.category || "General"}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                      BETA
                    </span>
                    {egg.custom && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <Sparkles size={10} /> Custom
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[120px]" title={egg.author}>
                    by {egg.author || "Community"}
                  </span>
                </div>

                {/* Title and Description */}
                <h3 className="text-base font-bold text-foreground mb-1 group-hover:text-indigo-400 transition-colors">
                  {egg.name}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4 leading-relaxed">
                  {egg.description || "No description provided."}
                </p>

                {/* Specs */}
                <div className="space-y-2 bg-muted/40 p-3 rounded-xl border border-border-subtle mb-4 text-xs font-mono">
                  {/* Docker Image */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground font-sans text-[11px]">Docker:</span>
                    <div className="flex items-center gap-1 overflow-hidden">
                      <span className="text-foreground truncate max-w-[180px]" title={egg.dockerImage}>
                        {egg.dockerImage}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(egg.dockerImage, `${egg.id}-img`)}
                        title="Copy Docker Image"
                        className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      >
                        {copiedId === `${egg.id}-img` ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Port & Mount */}
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-sans">Default Port:</span>
                    <span className="text-foreground font-bold text-indigo-400">:{egg.defaultPort}</span>
                  </div>

                  {/* Startup Command */}
                  <div className="pt-1 border-t border-border-subtle">
                    <span className="text-muted-foreground font-sans text-[10px] block mb-0.5">Startup Command:</span>
                    <p className="text-[11px] text-foreground/80 truncate bg-card/60 px-2 py-1 rounded border border-border-subtle" title={egg.startupCommand}>
                      {egg.startupCommand}
                    </p>
                  </div>
                </div>

                {/* Versions Chips */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                      <Tag size={12} className="text-indigo-400" /> Versions ({egg.versions?.length || 0})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setVersionModalEgg(egg);
                        setNewVersionInput("");
                        setBulkVersionsText("");
                      }}
                      className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    >
                      + Manage / Import
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(egg.versions || ["latest"]).slice(0, 4).map((v) => (
                      <span key={v} className="text-[10px] font-mono px-1.5 py-0.5 bg-muted rounded border border-border text-foreground-muted">
                        {v}
                      </span>
                    ))}
                    {(egg.versions?.length || 0) > 4 && (
                      <span className="text-[10px] px-1.5 py-0.5 text-muted-foreground">
                        +{(egg.versions?.length || 0) - 4} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => navigate(`/servers/create?eggId=${egg.id}`)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white rounded-lg text-xs font-semibold transition-all cursor-pointer border border-indigo-500/20"
                >
                  <Server size={13} />
                  <span>Deploy</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleExportJson(egg)}
                    title="Export as JSON"
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditModal(egg)}
                    title="Edit Egg"
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletingEgg(egg)}
                    title="Delete Egg"
                    className="p-1.5 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT EGG MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-6 relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Egg size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      {editingEgg ? "Edit Software Egg" : "Create Custom Software Egg"}
                    </h3>
                    <p className="text-xs text-muted-foreground">Configure docker container image, commands, and versions.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveEgg} className="space-y-4">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Egg Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PocketMine-MP or Node.js Bot"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full bg-muted/60 border border-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Author Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Nova Admin"
                      value={formAuthor}
                      onChange={(e) => setFormAuthor(e.target.value)}
                      className="w-full bg-muted/60 border border-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Category & Type Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full bg-muted/60 border border-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Minecraft Java">Minecraft Java</option>
                      <option value="Minecraft Bedrock">Minecraft Bedrock</option>
                      <option value="Minecraft Proxies">Minecraft Proxies</option>
                      <option value="Bots & Web">Bots & Web</option>
                      <option value="Game Servers">Game Servers</option>
                      <option value="Custom">Custom</option>
                      <option value="CUSTOM">+ Specify New Category...</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1 flex items-center justify-between">
                      <span>Egg Type</span>
                      <span className="text-[10px] text-amber-500 font-bold uppercase px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20">BETA</span>
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value)}
                      className="w-full bg-muted/60 border border-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 font-mono font-semibold"
                    >
                      <option value="BETA">BETA (Recommended)</option>
                      <option value="STABLE">STABLE (Production)</option>
                      <option value="ALPHA">ALPHA (Experimental)</option>
                    </select>
                  </div>
                  {formCategory === "CUSTOM" && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-foreground mb-1">Custom Category Name</label>
                      <input
                        type="text"
                        placeholder="e.g. AI & Voice Bots"
                        value={formCustomCategory}
                        onChange={(e) => setFormCustomCategory(e.target.value)}
                        className="w-full bg-muted/60 border border-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description of this software template..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-muted/60 border border-border rounded-xl px-3.5 py-2 text-sm text-foreground focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                {/* Docker & Container Specs */}
                <div className="p-4 bg-muted/30 border border-border rounded-xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Terminal size={14} /> Docker & Engine Configuration
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">Docker Image *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. itzg/minecraft-server:latest or node:20-alpine"
                      value={formDockerImage}
                      onChange={(e) => setFormDockerImage(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3.5 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-indigo-500"
                    />
                    <p className="text-[11px] text-muted-foreground mt-1">Docker Hub or GitHub Container Registry (ghcr.io) image tag.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Default Port</label>
                      <input
                        type="number"
                        value={formDefaultPort}
                        onChange={(e) => setFormDefaultPort(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Container Mount Dir</label>
                      <input
                        type="text"
                        value={formMountDir}
                        onChange={(e) => setFormMountDir(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-1">Stop Command</label>
                      <input
                        type="text"
                        value={formStopCommand}
                        onChange={(e) => setFormStopCommand(e.target.value)}
                        placeholder="e.g. stop or ^C"
                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-sm font-mono text-foreground focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Startup Command */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-foreground">Startup Command</label>
                      <span className="text-[10px] text-muted-foreground">Supports variable placeholders</span>
                    </div>
                    <textarea
                      rows={2}
                      value={formStartupCommand}
                      onChange={(e) => setFormStartupCommand(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    {/* Helper chips to append placeholders */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-muted-foreground self-center mr-1">Insert:</span>
                      {[
                        "{{SERVER_MEMORY}}",
                        "{{SERVER_PORT}}",
                        "{{VERSION}}",
                        "{{SERVER_JARFILE}}"
                      ].map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => setFormStartupCommand(prev => prev + " " + chip)}
                          className="text-[10px] font-mono px-2 py-0.5 bg-card hover:bg-muted border border-border rounded text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                        >
                          + {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Software Versions */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Software Versions (Comma separated or new line)
                  </label>
                  <textarea
                    rows={2}
                    value={formVersionsText}
                    onChange={(e) => setFormVersionsText(e.target.value)}
                    placeholder="e.g. latest, 1.21.1, 1.20.4, 1.19.4"
                    className="w-full bg-muted/60 border border-border rounded-xl px-3.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500 resize-none"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Users will be able to select from these versions during server creation.</p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 bg-muted hover:bg-muted-hover text-foreground text-sm font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    {editingEgg ? "Save Changes" : "Create Egg"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* IMPORT EGG JSON MODAL */}
      <AnimatePresence>
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-xl p-6 relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                    <Upload size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Import Software Egg</h3>
                    <p className="text-xs text-muted-foreground">Upload or paste standard Pterodactyl or Nova egg JSON.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              {importError && (
                <div className="p-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle size={15} />
                  <span>{importError}</span>
                </div>
              )}

              <form onSubmit={handleImportSubmit} className="space-y-4">
                {/* File Drop Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border hover:border-indigo-500/50 bg-muted/30 hover:bg-muted/50 p-6 rounded-2xl text-center cursor-pointer transition-all"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".json"
                    className="hidden"
                  />
                  <FileCode className="w-8 h-8 mx-auto text-indigo-400 mb-2 opacity-80" />
                  <p className="text-sm font-semibold text-foreground">
                    {importFileName ? importFileName : "Click to select or drop an Egg JSON file"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Accepts exported .json from Pterodactyl, Pelican, or Nova.
                  </p>
                </div>

                {/* Paste Area */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Or Paste Raw Egg JSON:
                  </label>
                  <textarea
                    rows={6}
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    placeholder='{"name": "My Custom Egg", "docker_images": {...}, "startup": "..."}'
                    className="w-full bg-muted/60 border border-border rounded-xl p-3 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500 resize-none shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="px-4 py-2 bg-muted hover:bg-muted-hover text-foreground text-sm font-medium rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!importJsonText.trim()}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                  >
                    Import Egg
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* VERSION MANAGER / IMPORT VERSIONS MODAL */}
      <AnimatePresence>
        {versionModalEgg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg p-6 relative"
            >
              <div className="flex items-center justify-between pb-4 border-b border-border-subtle mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
                    <Tag size={18} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">Manage Versions</h3>
                    <p className="text-xs text-muted-foreground">{versionModalEgg.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVersionModalEgg(null)}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Existing Versions List */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1.5">
                    Configured Versions ({versionModalEgg.versions?.length || 0})
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-3 bg-muted/40 border border-border-subtle rounded-xl max-h-40 overflow-y-auto custom-scrollbar">
                    {(versionModalEgg.versions || []).map((ver) => (
                      <span
                        key={ver}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-card border border-border rounded-lg text-xs font-mono text-foreground group"
                      >
                        <span>{ver}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteVersion(ver)}
                          title={`Delete ${ver}`}
                          className="text-muted-foreground hover:text-red-400 transition-colors cursor-pointer"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Add Single Version */}
                <div className="p-3 bg-muted/20 border border-border rounded-xl">
                  <label className="block text-xs font-semibold text-foreground mb-1">Add Single Version</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. 1.21.3 or v22.0.0"
                      value={newVersionInput}
                      onChange={(e) => setNewVersionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddVersion();
                        }
                      }}
                      className="flex-1 bg-card border border-border rounded-xl px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddVersion}
                      disabled={!newVersionInput.trim()}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Bulk Import Versions */}
                <div className="p-3 bg-muted/20 border border-border rounded-xl">
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Bulk Import Versions (Paste comma-separated or list)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 1.21.2, 1.21.1, 1.21.0, 1.20.4, 1.20.2"
                    value={bulkVersionsText}
                    onChange={(e) => setBulkVersionsText(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl p-2.5 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500 resize-none mb-2"
                  />
                  <button
                    type="button"
                    onClick={handleImportBulkVersions}
                    disabled={!bulkVersionsText.trim()}
                    className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                  >
                    Import All Versions
                  </button>
                </div>

                <div className="flex justify-end pt-3 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setVersionModalEgg(null)}
                    className="px-4 py-2 bg-muted hover:bg-muted-hover text-foreground text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingEgg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4">
                <Trash2 size={24} />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1">Delete Software Egg?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete <strong className="text-foreground">{deletingEgg.name}</strong>? Existing servers using this software will not be deleted, but it will no longer be available for new server creation.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingEgg(null)}
                  className="px-4 py-2 bg-muted hover:bg-muted-hover text-foreground text-sm font-medium rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteEgg}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
