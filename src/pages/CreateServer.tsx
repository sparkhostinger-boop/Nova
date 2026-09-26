// @ts-nocheck
import React, { useEffect, useState } from "react";
import { LoadingOverlay } from "../components/LoadingOverlay";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Server,
  ArrowLeft,
  ArrowRight,
  Cpu,
  HardDrive,
  MemoryStick,
  Globe,
  User,
  AlertTriangle,
  Sparkles,
  Check,
  Zap,
  Box,
  FastForward,
  Network,
  Wrench,
  Feather,
  CheckCircle2,
  TerminalSquare,
  Unlock,
  Egg,
  Code2,
  Tag,
  Upload,
  ExternalLink,
  Terminal,
  Sliders,
  Copy,
  Plus
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SearchableDropdown from "../components/SearchableDropdown";

export default function CreateServer() {
  const SOFTWARE_TYPES = [
    { id: "PAPER", name: "Paper", desc: "Performance Vanilla", icon: Zap, color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", activeRing: "ring-amber-500/50", glow: "to-amber-500/10" },
    { id: "VELOCITY", name: "Velocity", desc: "Next-gen Proxy", icon: FastForward, color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", activeRing: "ring-cyan-500/50", glow: "to-cyan-500/10" },
    { id: "BUNGEECORD", name: "BungeeCord", desc: "Classic Proxy", icon: Network, color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20", activeRing: "ring-orange-500/50", glow: "to-orange-500/10" },
    { id: "FORGE", name: "Forge", desc: "Modded Minecraft", icon: Wrench, color: "text-stone-400", bg: "bg-stone-400/10", border: "border-stone-400/20", activeRing: "ring-stone-500/50", glow: "to-stone-500/10" },
    { id: "FABRIC", name: "Fabric", desc: "Lightweight Mods", icon: Feather, color: "text-amber-200", bg: "bg-amber-200/10", border: "border-amber-200/20", activeRing: "ring-amber-300/50", glow: "to-amber-300/10" },
    { id: "CUSTOM", name: "Custom", desc: "Custom Eggs & Specs", icon: Egg, color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20", activeRing: "ring-purple-500/50", glow: "to-purple-500/10", badge: "BETA" },
  ];

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [name, setName] = useState("");
  const [motd, setMotd] = useState("A Minecraft Server");
  const [cracked, setCracked] = useState(false);

  const [ram, setRam] = useState<string>("4");
  const [cpu, setCpu] = useState<string>("150");
  const [disk, setDisk] = useState<string>("10");

  const [port, setPort] = useState<string>("25565");
  const [ipAlias, setIpAlias] = useState<string>("");
  const [owner, setOwner] = useState("");
  const [nodeId, setNodeId] = useState("local");

  const [type, setType] = useState<string>("PAPER");
  const [version, setVersion] = useState("1.21.1");
  
  const [nodes, setNodes] = useState<any[]>([]);
  const [versions, setVersions] = useState<string[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  // Custom Egg State
  const [eggs, setEggs] = useState<any[]>([]);
  const [selectedEggId, setSelectedEggId] = useState<string>("");
  const [eggSearch, setEggSearch] = useState<string>("");
  const [eggCategoryFilter, setEggCategoryFilter] = useState<string>("ALL");
  const [customDockerImage, setCustomDockerImage] = useState<string>("");
  const [customStartupCommand, setCustomStartupCommand] = useState<string>("");
  const [showVersionImport, setShowVersionImport] = useState(false);
  const [newVersionInput, setNewVersionInput] = useState("");
  const [bulkVersionInput, setBulkVersionInput] = useState("");
  const [versionSuccessMsg, setVersionSuccessMsg] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [createProgress, setCreateProgress] = useState(0);
  const [totalSystemRam, setTotalSystemRam] = useState<number>(0);
  const [showRamWarning, setShowRamWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();
  const { user } = useAuth();

  const ramPresets = [2, 4, 8, 16, 24, 32, 48, 64];

  const handleRamSelect = (val: number) => {
    setRam(val.toString());
    let autoCpu = 100;
    if (val <= 2) autoCpu = 100;
    else if (val <= 4) autoCpu = 150;
    else if (val <= 8) autoCpu = 200;
    else if (val <= 16) autoCpu = 300;
    else if (val <= 24) autoCpu = 400;
    else if (val <= 32) autoCpu = 500;
    else if (val <= 48) autoCpu = 600;
    else if (val <= 64) autoCpu = 800;
    setCpu(autoCpu.toString());
  };

  const selectedEgg = eggs.find(e => e.id === selectedEggId) || eggs[0] || null;

  // Load eggs from API
  const loadEggs = async () => {
    try {
      const res = await axios.get("/api/eggs");
      setEggs(res.data);
      const params = new URLSearchParams(window.location.search);
      const urlEggId = params.get("eggId");
      if (urlEggId) {
        setType("CUSTOM");
        setSelectedEggId(urlEggId);
        const match = res.data.find((e: any) => e.id === urlEggId);
        if (match) {
          if (match.defaultPort && port === "25565") setPort(String(match.defaultPort));
          if (match.versions?.length > 0) setVersion(match.versions[0]);
          setCustomDockerImage(match.dockerImage || "");
          setCustomStartupCommand(match.startupCommand || "");
        }
      } else if (res.data.length > 0 && !selectedEggId) {
        setSelectedEggId(res.data[0].id);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadEggs();
  }, []);

  useEffect(() => {
    if (type === "CUSTOM") {
      if (selectedEgg) {
        const vList = selectedEgg.versions && selectedEgg.versions.length > 0 
          ? selectedEgg.versions 
          : ["latest"];
        setVersions(vList);
        if (!vList.includes(version)) {
          setVersion(vList[0]);
        }
        setCustomDockerImage(selectedEgg.dockerImage || "");
        setCustomStartupCommand(selectedEgg.startupCommand || "");
      }
      return;
    }

    axios.get(`/api/system/versions?type=${type}`).then((res) => {
      setVersions(res.data);
      if (res.data.length > 0) setVersion(res.data[0]);
    });
  }, [type, selectedEggId]);

  useEffect(() => {
    axios
      .get("/api/system/stats")
      .then((res) => {
        setTotalSystemRam(res.data.totalMemory / (1024 * 1024 * 1024));
      })
      .catch(() => {});

    if (user?.role === "admin" || user?.role === "owner") {
      axios.get("/api/nodes").then((res) => setNodes(res.data)).catch(() => {});
    }

    axios
      .get("/api/auth/users")
      .then((res) => {
        setUsers(res.data);
        if (res.data.length > 0) {
          const defaultOwner =
            res.data.find((u: any) => u.id === user?.id)?.id || res.data[0].id;
          setOwner(defaultOwner);
        }
      })
      .catch(() => {});
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < totalSteps) {
      setStep(step + 1);
      return;
    }

    if (totalSystemRam > 0 && Number(ram) > totalSystemRam && !showRamWarning) {
      setShowRamWarning(true);
      return;
    }
    executeSubmit();
  };

  const executeSubmit = async () => {
    setShowRamWarning(false);
    setLoading(true);
    setCreateProgress(0);
    setError(null);

    const interval = setInterval(() => {
      setCreateProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + (Math.random() * 8 + 2);
      });
    }, 300);

    try {
      const payload: any = {
        name,
        ram: Number(ram),
        cpu: Number(cpu),
        disk: Number(disk),
        port: Number(port),
        ipAlias,
        type,
        version,
        motd,
        cracked,
      };

      if (type === "CUSTOM" && selectedEgg) {
        payload.type = selectedEgg.name;
        payload.customEgg = true;
        payload.eggId = selectedEgg.id;
        payload.eggName = selectedEgg.name;
        payload.dockerImage = customDockerImage || selectedEgg.dockerImage;
        payload.startupCommand = customStartupCommand || selectedEgg.startupCommand;
        payload.stopCommand = selectedEgg.stopCommand;
        payload.mountDir = selectedEgg.mountDir || "/data";
      }

      if (owner) payload.owner = owner;
      if (nodeId) payload.nodeId = nodeId;

      await axios.post("/api/servers", payload);
      clearInterval(interval);
      setCreateProgress(100);
      setTimeout(() => navigate("/servers"), 800);
    } catch (e: any) {
      clearInterval(interval);
      setCreateProgress(0);
      setError(e.response?.data?.error || "Failed to create server");
      setLoading(false);
    }
  };
  
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleAddEggVersion = async () => {
    if (!selectedEgg || !newVersionInput.trim()) return;
    try {
      const res = await axios.post(`/api/eggs/${selectedEgg.id}/versions`, {
        version: newVersionInput.trim()
      });
      const updatedVersions = res.data.versions || [];
      setVersionSuccessMsg(`Added version "${newVersionInput.trim()}"`);
      setTimeout(() => setVersionSuccessMsg(null), 3000);
      setNewVersionInput("");
      setEggs(prev => prev.map(e => e.id === selectedEgg.id ? { ...e, versions: updatedVersions } : e));
      setVersions(updatedVersions);
      setVersion(newVersionInput.trim());
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to add version");
    }
  };

  const handleBulkImportEggVersions = async () => {
    if (!selectedEgg || !bulkVersionInput.trim()) return;
    try {
      const res = await axios.post(`/api/eggs/${selectedEgg.id}/versions`, {
        versions: bulkVersionInput.trim()
      });
      const updatedVersions = res.data.versions || [];
      setVersionSuccessMsg(`Imported ${res.data.addedCount || 'new'} version(s)!`);
      setTimeout(() => setVersionSuccessMsg(null), 3000);
      setBulkVersionInput("");
      setShowVersionImport(false);
      setEggs(prev => prev.map(e => e.id === selectedEgg.id ? { ...e, versions: updatedVersions } : e));
      setVersions(updatedVersions);
      if (updatedVersions.length > 0) {
        setVersion(updatedVersions[0]);
      }
    } catch (e: any) {
      setError(e.response?.data?.error || "Failed to import versions");
    }
  };

  const eggCategories = ["ALL", ...Array.from(new Set(eggs.map(e => e.category || "General")))];

  const filteredEggList = eggs.filter(e => {
    const matchesSearch = 
      e.name.toLowerCase().includes(eggSearch.toLowerCase()) ||
      (e.description && e.description.toLowerCase().includes(eggSearch.toLowerCase())) ||
      (e.dockerImage && e.dockerImage.toLowerCase().includes(eggSearch.toLowerCase()));
    const matchesCat = eggCategoryFilter === "ALL" || e.category === eggCategoryFilter;
    return matchesSearch && matchesCat;
  });

  const renderStepIndicator = () => {
    return (
      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted-subtle rounded-full -z-10 overflow-hidden">
           <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }} />
        </div>
        
        {[1, 2, 3, 4].map(num => (
          <div key={num} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= num ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-muted border border-border text-muted-foreground'}`}>
            {step > num ? <Check size={16} /> : num}
          </div>
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-3xl mx-auto relative z-10"
    >
      <div className="mb-8">
        <Link to="/servers" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={16} className="mr-2" /> Back to Servers
        </Link>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground mb-2">Create Server</h1>
        <p className="text-muted-foreground text-sm">Configure a new game server in minutes.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card p-4 md:p-5 rounded-2xl border border-border-subtle shadow-2xl relative">
        {renderStepIndicator()}
        
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-xl font-bold mb-4 flex items-center"><Server className="w-5 h-5 mr-2 text-indigo-400" /> Basic Details</h2>
                
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">Server Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-muted-subtle border border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-2 text-foreground transition-all shadow-inner outline-none"
                    placeholder="e.g. Survival SMP"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2 flex items-center">
                    <TerminalSquare className="w-4 h-4 mr-2 text-indigo-400" /> Server MOTD
                  </label>
                  <input
                    type="text"
                    required
                    value={motd}
                    onChange={(e) => setMotd(e.target.value)}
                    className="w-full bg-muted-subtle border border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-2 text-foreground transition-all shadow-inner outline-none font-mono text-sm"
                    placeholder="A Minecraft Server"
                  />
                </div>
                
                <div className="pt-2">
                  <div className="bg-muted border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-foreground flex items-center"><Unlock className="w-4 h-4 mr-2 text-red-400" /> Cracked Mode</h4>
                      <p className="text-xs text-muted-foreground mt-1">Allow players without a premium Minecraft account to join (online-mode=false).</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCracked(!cracked)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${cracked ? 'bg-red-500' : 'bg-muted-hover border border-border'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cracked ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
            
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-xl font-bold mb-4 flex items-center"><Cpu className="w-5 h-5 mr-2 text-indigo-400" /> Resource Allocation</h2>
                
                <div className="bg-muted-subtle p-4 rounded-2xl border border-border-subtle space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground-muted mb-2 flex items-center justify-between">
                      <span className="flex items-center"><MemoryStick className="w-4 h-4 mr-2 text-indigo-400" /> Memory (RAM)</span>
                      <span className="text-xs text-indigo-400 font-bold bg-indigo-500/10 px-2 py-0.5 rounded-md">{ram} GB</span>
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="1"
                        max="128"
                        step="1"
                        value={ram}
                        onChange={(e) => handleRamSelect(Number(e.target.value))}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-500"
                      />
                      <input
                        type="number"
                        min="1"
                        value={ram}
                        onChange={(e) => handleRamSelect(Number(e.target.value))}
                        className="w-20 bg-muted border border-border rounded-lg px-2 py-1 text-center font-mono text-sm outline-none focus:border-indigo-500"
                      />
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-4">
                      {ramPresets.map(preset => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleRamSelect(preset)}
                          className={`py-1.5 px-3 rounded-lg text-xs font-medium transition-all border ${
                            Number(ram) === preset 
                              ? "bg-indigo-500 text-white border-indigo-600 shadow-md" 
                              : "bg-muted text-muted-foreground border-border hover:bg-muted-hover hover:text-foreground"
                          }`}
                        >
                          {preset}GB
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-muted-subtle p-4 rounded-2xl border border-border-subtle">
                    <label className="block text-sm font-medium text-foreground-muted mb-2 flex items-center justify-between">
                      <span className="flex items-center"><Cpu className="w-4 h-4 mr-2 text-indigo-400" /> CPU Limit (%)</span>
                      <span className="text-xs text-indigo-400 font-bold">{cpu}%</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="50"
                      value={cpu}
                      onChange={(e) => setCpu(e.target.value)}
                      className="w-full bg-muted border border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-2 text-foreground transition-all shadow-inner outline-none font-mono mt-1"
                    />
                    <p className="text-[10px] text-muted-foreground mt-2">100% = 1 Core. E.g., 200% = 2 Cores.</p>
                  </div>
                  
                  <div className="bg-muted-subtle p-4 rounded-2xl border border-border-subtle">
                    <label className="block text-sm font-medium text-foreground-muted mb-2 flex items-center justify-between">
                      <span className="flex items-center"><HardDrive className="w-4 h-4 mr-2 text-indigo-400" /> Disk Space</span>
                      <span className="text-xs text-indigo-400 font-bold">{disk} GB</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={disk}
                      onChange={(e) => setDisk(e.target.value)}
                      className="w-full bg-muted border border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-2 text-foreground transition-all shadow-inner outline-none font-mono mt-1"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-xl font-bold mb-4 flex items-center"><Network className="w-5 h-5 mr-2 text-indigo-400" /> Network & Ownership</h2>
                
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2 flex items-center justify-between">
                    <span className="flex items-center"><Globe className="w-4 h-4 mr-2 text-indigo-400" /> Primary Port</span>
                    {error?.includes("Port") && (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 font-bold">PORT TAKEN</span>
                    )}
                  </label>
                  <input
                    type="number"
                    required
                    value={port}
                    onChange={(e) => {
                      setPort(e.target.value);
                      if (error?.includes("Port")) setError(null);
                    }}
                    className={`w-full bg-muted-subtle border focus:ring-1 rounded-xl px-4 py-2 text-foreground transition-all shadow-inner outline-none font-mono ${error?.includes("Port") ? "border-red-500 focus:border-red-500 focus:ring-red-500/50" : "border-border focus:border-indigo-500 focus:ring-indigo-500/50"}`}
                  />
                  <p className="text-[11px] text-muted-foreground mt-2">Minecraft default is 25565. Bedrock default is 19132.</p>
                </div>

                <div className="pt-2 border-t border-border-subtle">
                  <label className="block text-sm font-medium text-foreground-muted mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2 text-indigo-400" /> Assign Server Owner
                  </label>
                  <SearchableDropdown
                    value={owner}
                    onChange={setOwner}
                    options={users.map(u => ({ value: u.id, label: `${u.username} ${u.id === user?.id ? "(You)" : `(${u.role})`}` }))}
                    placeholder="Select a user..."
                    searchPlaceholder="Search users..."
                  />
                  <p className="text-xs text-muted-foreground mt-2">Select which user owns and has access to this server.</p>
                </div>

                {(user?.role === "admin" || user?.role === "owner") && (
                  <div className="pt-2 border-t border-border-subtle">
                    <label className="block text-sm font-medium text-foreground-muted mb-2 flex items-center">
                      <Globe className="w-4 h-4 mr-2 text-indigo-400" /> Target Node
                    </label>
                    <SearchableDropdown
                      value={nodeId}
                      onChange={setNodeId}
                      options={nodes.map(n => ({ value: n.id, label: n.name + " (" + n.ip + ")" }))}
                      placeholder="Select a node..."
                      searchPlaceholder="Search nodes..."
                    />
                    <p className="text-xs text-muted-foreground mt-2">Select which physical node this server container will be created on.</p>
                  </div>
                )}
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center"><Box className="w-5 h-5 mr-2 text-indigo-400" /> Software Selection</h2>
                  {type === "CUSTOM" && (
                    <Link
                      to="/admin/eggs"
                      target="_blank"
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 hover:underline"
                    >
                      <ExternalLink size={12} /> Open Egg Manager
                    </Link>
                  )}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {SOFTWARE_TYPES.map((soft) => {
                    const isSelected = type === soft.id;
                    const Icon = soft.icon;
                    return (
                      <button
                        key={soft.id}
                        type="button"
                        onClick={() => {
                          setType(soft.id);
                          if (soft.id === "CUSTOM" && eggs.length > 0 && !selectedEggId) {
                            setSelectedEggId(eggs[0].id);
                          }
                        }}
                        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                          isSelected 
                            ? `${soft.bg} ${soft.border} ring-1 ${soft.activeRing} shadow-lg` 
                            : "bg-muted-subtle border-border-subtle hover:border-border-strong hover:bg-muted"
                        }`}
                      >
                        {isSelected && <div className={`absolute inset-0 bg-gradient-to-br from-transparent ${soft.glow}`} />}
                        
                        {(soft as any).badge && (
                          <span className="absolute top-1.5 left-1.5 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30 leading-none z-10">
                            {(soft as any).badge}
                          </span>
                        )}

                        <Icon className={`w-6 h-6 mb-1.5 ${isSelected ? soft.color : "text-muted-foreground group-hover:text-foreground-muted"} transition-colors relative z-10`} />
                        <span className={`text-xs font-bold relative z-10 ${isSelected ? "text-foreground" : "text-foreground-muted"}`}>{soft.name}</span>
                        <span className={`text-[9px] text-center mt-0.5 relative z-10 ${isSelected ? "text-foreground/70" : "text-muted-foreground"}`}>{soft.desc}</span>
                        
                        {isSelected && (
                          <div className={`absolute top-1.5 right-1.5 ${soft.color}`}>
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* CUSTOM EGG SELECTION & SPECS */}
                {type === "CUSTOM" ? (
                  <div className="space-y-4 pt-2 border-t border-border-subtle">
                    {/* Filter & Search Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
                      <div className="relative w-full sm:w-64">
                        <input
                          type="text"
                          placeholder="Search custom eggs..."
                          value={eggSearch}
                          onChange={(e) => setEggSearch(e.target.value)}
                          className="w-full bg-muted border border-border rounded-xl px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-0.5 custom-scrollbar">
                        {eggCategories.map(cat => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setEggCategoryFilter(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                              eggCategoryFilter === cat
                                ? "bg-indigo-600 text-white"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Egg Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto custom-scrollbar p-1">
                      {filteredEggList.map((egg) => {
                        const isChosen = (selectedEgg?.id || "") === egg.id;
                        return (
                          <div
                            key={egg.id}
                            onClick={() => {
                              setSelectedEggId(egg.id);
                              if (egg.versions && egg.versions.length > 0) {
                                setVersion(egg.versions[0]);
                              }
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isChosen
                                ? "bg-indigo-500/10 border-indigo-500/40 ring-1 ring-indigo-500/30 shadow-sm"
                                : "bg-muted/40 border-border hover:bg-muted/70"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-xs font-bold text-foreground truncate">{egg.name}</span>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400">
                                  {egg.category}
                                </span>
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                                  BETA
                                </span>
                                {egg.custom && (
                                  <span className="text-[10px] font-semibold px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-400">
                                    Custom
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-1 mb-2">
                              {egg.description || "No description."}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                              <span className="truncate max-w-[150px]">{egg.dockerImage}</span>
                              <span className="text-indigo-400 font-bold">Port :{egg.defaultPort}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Selected Egg Specifications Card */}
                    {selectedEgg && (
                      <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                            <Sliders size={14} /> Egg Specifications: {selectedEgg.name}
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/30">
                              BETA
                            </span>
                          </h3>
                          {Number(port) !== selectedEgg.defaultPort && (
                            <button
                              type="button"
                              onClick={() => setPort(String(selectedEgg.defaultPort))}
                              className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                            >
                              Set Port to :{selectedEgg.defaultPort}
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                          {/* Docker Image */}
                          <div className="p-2.5 bg-card rounded-lg border border-border-subtle">
                            <span className="text-muted-foreground text-[10px] block mb-0.5">Docker Image</span>
                            <div className="flex items-center justify-between gap-1 font-mono text-[11px]">
                              <span className="truncate text-foreground" title={selectedEgg.dockerImage}>{selectedEgg.dockerImage}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyText(selectedEgg.dockerImage, "docker-img")}
                                className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                                title="Copy image"
                              >
                                {copiedText === "docker-img" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>

                          {/* Default Port */}
                          <div className="p-2.5 bg-card rounded-lg border border-border-subtle">
                            <span className="text-muted-foreground text-[10px] block mb-0.5">Default Port</span>
                            <span className="font-mono text-[11px] text-foreground font-bold">:{selectedEgg.defaultPort}</span>
                          </div>

                          {/* Mount Dir */}
                          <div className="p-2.5 bg-card rounded-lg border border-border-subtle">
                            <span className="text-muted-foreground text-[10px] block mb-0.5">Data Mount</span>
                            <span className="font-mono text-[11px] text-foreground">{selectedEgg.mountDir || "/data"}</span>
                          </div>
                        </div>

                        {/* Startup Command */}
                        <div className="p-2.5 bg-card rounded-lg border border-border-subtle">
                          <span className="text-muted-foreground text-[10px] block mb-0.5 font-sans">Startup Command</span>
                          <p className="font-mono text-[11px] text-foreground/90 break-all bg-muted/40 p-2 rounded border border-border-subtle">
                            {selectedEgg.startupCommand || "Default container entrypoint"}
                          </p>
                        </div>

                        {/* Software Version Selection & Inline Importer */}
                        <div className="pt-2 border-t border-border-subtle">
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                              <Tag size={13} className="text-indigo-400" /> Software Version
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowVersionImport(!showVersionImport)}
                              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                            >
                              <Plus size={12} /> {showVersionImport ? "Hide Importer" : "Import / Add Version"}
                            </button>
                          </div>

                          {versionSuccessMsg && (
                            <div className="mb-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-1.5">
                              <Check size={14} /> {versionSuccessMsg}
                            </div>
                          )}

                          <SearchableDropdown
                            value={version}
                            onChange={setVersion}
                            options={versions.map(v => ({ value: v, label: v }))}
                            placeholder="Select version..."
                            searchPlaceholder="Search versions..."
                            className="font-mono"
                          />

                          {/* Expandable Version Importer */}
                          <AnimatePresence>
                            {showVersionImport && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 p-3 bg-card border border-border rounded-xl space-y-3 overflow-hidden"
                              >
                                <div className="text-xs font-semibold text-foreground flex items-center gap-1">
                                  <Upload size={13} className="text-indigo-400" /> Import or Add Versions for {selectedEgg.name}
                                </div>
                                
                                {/* Single Version Input */}
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    placeholder="Add single version (e.g. 1.21.3 or v2.0.0)"
                                    value={newVersionInput}
                                    onChange={(e) => setNewVersionInput(e.target.value)}
                                    className="flex-1 bg-muted border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleAddEggVersion}
                                    disabled={!newVersionInput.trim()}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Add
                                  </button>
                                </div>

                                {/* Bulk Import Textarea */}
                                <div>
                                  <span className="text-[11px] text-muted-foreground block mb-1">
                                    Or paste multiple comma-separated versions:
                                  </span>
                                  <textarea
                                    rows={2}
                                    placeholder="1.21.3, 1.21.2, 1.21.1, 1.20.4"
                                    value={bulkVersionInput}
                                    onChange={(e) => setBulkVersionInput(e.target.value)}
                                    className="w-full bg-muted border border-border rounded-lg p-2 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500 resize-none mb-1.5"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleBulkImportEggVersions}
                                    disabled={!bulkVersionInput.trim()}
                                    className="w-full py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-500/30 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                  >
                                    Bulk Import Versions
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-2 border-t border-border-subtle">
                    <label className="block text-sm font-medium text-foreground-muted mb-2 flex items-center">
                      <Box className="w-4 h-4 mr-2 text-cyan-400" /> Software Version
                    </label>
                    <SearchableDropdown
                      value={version}
                      onChange={setVersion}
                      options={versions.map(v => ({ value: v, label: v }))}
                      placeholder="Select a version..."
                      searchPlaceholder="Search versions..."
                      className="font-mono"
                    />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 pt-4 border-t border-border-subtle flex justify-between items-center">
          {step > 1 ? (
             <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2 bg-muted hover:bg-muted-hover text-foreground font-medium rounded-xl transition-colors"
             >
                Back
             </button>
          ) : <div></div>}

          <div className="flex-1 flex justify-end">
             {error && !error.includes("Port") && step === 4 && (
               <div className="mr-4 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center text-red-400">
                 <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                 <p className="text-xs font-medium">{error}</p>
               </div>
             )}
             
             {step < totalSteps ? (
               <button
                 type="submit"
                 className="px-6 py-2 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors flex items-center shadow-lg shadow-indigo-500/20 active:scale-[0.98]"
               >
                 Next Step <ArrowRight className="w-4 h-4 ml-2" />
               </button>
             ) : (
               <button
                 type="submit"
                 disabled={loading}
                 className="px-6 py-2 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition-colors flex items-center shadow-lg shadow-indigo-500/20 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
               >
                 {loading ? (
                   <>
                     <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                     Creating...
                   </>
                 ) : (
                   <>
                     <Sparkles className="w-4 h-4 mr-2" />
                     Launch Server
                   </>
                 )}
               </button>
             )}
          </div>
        </div>
      </form>

      <AnimatePresence>
        {showRamWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#121214] border border-red-500/30 shadow-2xl shadow-red-500/10 rounded-2xl p-5 max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-amber-500" />
              <div className="flex items-start mb-4">
                <div className="bg-red-500/10 p-3 rounded-full mr-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-1">High RAM Allocation</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    You are attempting to allocate <strong className="text-foreground">{ram}GB</strong> of RAM, but this system only has <strong className="text-foreground">{totalSystemRam.toFixed(1)}GB</strong> physically available. 
                  </p>
                  <p className="text-muted-foreground text-sm leading-relaxed mt-2">
                    The server has been configured to use memory on-demand, but if it actually consumes more than the available physical RAM during runtime, the host operating system may forcibly terminate (crash) it to prevent system instability.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRamWarning(false)}
                  className="px-4 py-2 bg-muted hover:bg-muted-hover text-foreground font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={executeSubmit}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold rounded-xl transition-colors border border-red-500/30"
                >
                  Yes, Proceed Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {(loading) && <LoadingOverlay message="Provisioning server resources..." progress={createProgress} />}
    </motion.div>
  );
}
