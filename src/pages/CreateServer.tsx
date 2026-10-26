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
  Plus,
  Eye,
  EyeOff,
  RefreshCw,
  Monitor,
  Key,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import SearchableDropdown from "../components/SearchableDropdown";

export const CPU_PRESETS = [
  { model: "AMD EPYC 7763 64-Core Processor", vendor: "AuthenticAMD", tag: "Server Flagship", desc: "64C/128T • 256MB L3 Cache" },
  { model: "AMD Ryzen 9 7950X3D 16-Core Processor", vendor: "AuthenticAMD", tag: "Desktop Flagship", desc: "16C/32T • 3D V-Cache 128MB" },
  { model: "AMD EPYC 9654 96-Core Processor", vendor: "AuthenticAMD", tag: "Next-Gen Server", desc: "96C/192T • Zen 4 Genoa" },
  { model: "Intel Xeon Platinum 8480+ 56-Core", vendor: "GenuineIntel", tag: "Scalable Server", desc: "56C/112T • Sapphire Rapids" },
  { model: "Intel Core i9-14900KS 24-Core", vendor: "GenuineIntel", tag: "Desktop Extreme", desc: "24C/32T • Up to 6.2 GHz" },
  { model: "Intel Core i7-13700K 16-Core", vendor: "GenuineIntel", tag: "Performance", desc: "16C/24T • Up to 5.4 GHz" },
  { model: "Intel Xeon E5-2699 v4 22-Core", vendor: "GenuineIntel", tag: "Workstation", desc: "22C/44T • Broadwell-EP" },
  { model: "Apple M3 Max (Emulated ARM64)", vendor: "AppleSilicon", tag: "Emulated ARM", desc: "16-Core CPU • ARM64 Neon" },
  { model: "QEMU Virtual CPU version 2.5+", vendor: "QEMUProject", tag: "Generic KVM", desc: "Native hypervisor passthrough" },
  { model: "Custom Model...", vendor: "CUSTOM", tag: "User Defined", desc: "Custom CPU model string" }
];

export const CPU_VENDORS = [
  { id: "AuthenticAMD", name: "AMD (AuthenticAMD)", label: "AuthenticAMD" },
  { id: "GenuineIntel", name: "Intel (GenuineIntel)", label: "GenuineIntel" },
  { id: "NovaCloud", name: "Nova Cloud", label: "NovaCloud" },
  { id: "AppleSilicon", name: "Apple Silicon", label: "AppleSilicon" },
  { id: "QEMUProject", name: "QEMU / KVM Project", label: "QEMUProject" },
  { id: "CUSTOM", name: "Custom Vendor...", label: "Custom Vendor" }
];

export const OS_DISTROS = [
  { id: "Ubuntu 24.04", name: "Ubuntu 24.04 LTS (Noble)", user: "ubuntu" },
  { id: "Ubuntu 22.04", name: "Ubuntu 22.04 LTS (Jammy)", user: "ubuntu" },
  { id: "Debian 12", name: "Debian 12 (Bookworm)", user: "debian" },
  { id: "Debian 11", name: "Debian 11 (Bullseye)", user: "debian" },
  { id: "Fedora 40", name: "Fedora 40 Cloud Base", user: "fedora" },
  { id: "AlmaLinux 9", name: "AlmaLinux 9 Cloud", user: "alma" },
  { id: "Rocky Linux 9", name: "Rocky Linux 9 Cloud", user: "rocky" },
  { id: "CentOS Stream 9", name: "CentOS Stream 9 Generic", user: "centos" },
];

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

  // Virtual Machine & Custom CPU Configuration
  const [cpuModel, setCpuModel] = useState<string>("AMD EPYC 7763 64-Core Processor");
  const [customCpuModel, setCustomCpuModel] = useState<string>("");
  const [cpuVendor, setCpuVendor] = useState<string>("AuthenticAMD");
  const [customVendorInput, setCustomVendorInput] = useState<string>("");
  const [vmUsername, setVmUsername] = useState<string>("ubuntu");
  const [vmPassword, setVmPassword] = useState<string>("ubuntu123");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [vmHostname, setVmHostname] = useState<string>("");
  const [sshPort, setSshPort] = useState<string>("2222");
  const [guiMode, setGuiMode] = useState<boolean>(false);
  const [osDistro, setOsDistro] = useState<string>("Ubuntu 24.04");
  const [showCpuAdvanced, setShowCpuAdvanced] = useState<boolean>(false);

  const generateRandomPassword = () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setVmPassword(pwd);
  };
  
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

  const isMinecraft = 
    type === "PAPER" || 
    type === "FORGE" || 
    type === "FABRIC" || 
    (type === "CUSTOM" && selectedEgg && (
      (selectedEgg.category || "").toLowerCase().includes("minecraft") ||
      (selectedEgg.name || "").toLowerCase().includes("minecraft") ||
      (selectedEgg.name || "").toLowerCase().includes("purpur") ||
      (selectedEgg.name || "").toLowerCase().includes("bedrock") ||
      (selectedEgg.dockerImage || "").toLowerCase().includes("minecraft")
    ));

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
          if (match.defaultPort && port === "25565") {
            setPort(String(match.defaultPort));
            setSshPort(String(match.defaultPort));
          }
          if (match.versions?.length > 0) {
            setVersion(match.versions[0]);
            setOsDistro(match.versions[0]);
          }
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
        if (selectedEgg.id === "egg-qemu-cloud-vm") {
          if (port === "25565") {
            setPort("2222");
            setSshPort("2222");
          }
          if (vList.length > 0) {
            setOsDistro(vList[0]);
          }
        }
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
      const finalCpuModel = cpuModel === "Custom Model..." 
        ? (customCpuModel.trim() || "Custom Virtual CPU") 
        : cpuModel;
      const finalCpuVendor = cpuVendor === "CUSTOM" 
        ? (customVendorInput.trim() || "CustomVendor") 
        : cpuVendor;
      const finalHostname = vmHostname.trim() || (name ? name.toLowerCase().replace(/[^a-z0-9_-]/g, "-") : "cloud-vm-1");

      const payload: any = {
        name,
        ram: Number(ram),
        cpu: Number(cpu),
        disk: Number(disk),
        port: Number(port),
        ipAlias,
        type,
        version: osDistro || version,
        motd: isMinecraft ? motd : "",
        cracked: isMinecraft ? Boolean(cracked) : false,
        cpuModel: finalCpuModel,
        cpuVendor: finalCpuVendor,
        vmUsername: vmUsername.trim() || "ubuntu",
        vmPassword: vmPassword.trim() || "ubuntu123",
        vmHostname: finalHostname,
        osDistro: osDistro || version || "Ubuntu 24.04",
        sshPort: Number(sshPort || port || 2222),
        guiMode: Boolean(guiMode),
        variables: {
          CPU_MODEL: finalCpuModel,
          CPU_VENDOR: finalCpuVendor,
          VM_USERNAME: vmUsername.trim() || "ubuntu",
          VM_PASSWORD: vmPassword.trim() || "ubuntu123",
          VM_HOSTNAME: finalHostname,
          SSH_PORT: String(sshPort || port || 2222),
          GUI_MODE: String(guiMode),
          OS_DISTRO: osDistro || version || "Ubuntu 24.04",
        }
      };

      if (type === "CUSTOM" && selectedEgg) {
        payload.type = selectedEgg.name;
        payload.customEgg = true;
        payload.eggId = selectedEgg.id;
        payload.eggName = selectedEgg.name;
        let chosenImage = customDockerImage || selectedEgg.dockerImage;
        if (chosenImage && (chosenImage.includes("multi-vm-manager") || chosenImage.includes("hopingboyz"))) {
          chosenImage = "ubuntu:22.04";
        }
        payload.dockerImage = chosenImage;
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

  const STEP_LABELS = [
    { num: 1, title: "Software" },
    { num: 2, title: "Details" },
    { num: 3, title: "Resources" },
    { num: 4, title: "Network" },
  ];

  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between relative mb-1">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted-subtle rounded-full -z-10 overflow-hidden">
             <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((step - 1) / (totalSteps - 1)) * 100}%` }} />
          </div>
          
          {STEP_LABELS.map(s => (
            <div key={s.num} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= s.num ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-muted border border-border text-muted-foreground'}`}>
                {step > s.num ? <Check size={16} /> : s.num}
              </div>
              <span className={`text-[11px] font-semibold mt-1 transition-colors ${step === s.num ? 'text-indigo-400 font-bold' : step > s.num ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.title}
              </span>
            </div>
          ))}
        </div>
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
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center"><Box className="w-5 h-5 mr-2 text-indigo-400" /> Select Software & Engine</h2>
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
                              if (egg.defaultPort) {
                                setPort(String(egg.defaultPort));
                                setSshPort(String(egg.defaultPort));
                              }
                              if (egg.id === "egg-qemu-cloud-vm") {
                                setOsDistro(egg.versions?.[0] || "Ubuntu 24.04");
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
                              onClick={() => {
                                setPort(String(selectedEgg.defaultPort));
                                setSshPort(String(selectedEgg.defaultPort));
                              }}
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

                    {/* Dedicated QEMU Virtual Machine Configuration Panel */}
                    {(selectedEgg?.id === "egg-qemu-cloud-vm" || selectedEgg?.category === "Virtualization" || selectedEgg?.category?.includes("Virtualization")) && (
                      <div className="bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-zinc-950/60 border border-indigo-500/30 rounded-2xl p-5 space-y-5 shadow-xl">
                        {/* Header Banner */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-indigo-500/20">
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                                <Cpu className="w-5 h-5" />
                              </div>
                              <h3 className="text-base font-bold text-white flex items-center gap-2">
                                QEMU Cloud Virtual Machine Settings
                              </h3>
                            </div>
                            <p className="text-xs text-zinc-400 mt-1">
                              Configure multi-OS QEMU cloud virtualization with custom CPU models, vendor ID, credentials, and network.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              QEMU MULTI-VM
                            </span>
                            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              KVM ACCEL
                            </span>
                          </div>
                        </div>

                        {/* OS Distribution Selection */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2 flex items-center gap-1.5">
                            <Tag size={13} /> Select Operating System Distribution
                          </label>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {OS_DISTROS.map((os) => {
                              const isSelected = osDistro === os.id || version === os.id;
                              return (
                                <button
                                  key={os.id}
                                  type="button"
                                  onClick={() => {
                                    setOsDistro(os.id);
                                    setVersion(os.id);
                                    if (os.user && vmUsername === "ubuntu") {
                                      setVmUsername(os.user);
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-indigo-600/30 border-indigo-400 ring-1 ring-indigo-400 text-white shadow-md"
                                      : "bg-zinc-900/60 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
                                  }`}
                                >
                                  <div className="text-xs font-bold truncate">{os.name}</div>
                                  <div className="text-[10px] text-zinc-400 mt-0.5">User: {os.user}</div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* CPU Model & Architecture Presets */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                              <Cpu size={13} /> Virtual CPU Model Emulation
                            </label>
                            <span className="text-[11px] text-zinc-400">
                              Selected: <strong className="text-indigo-400 font-mono">{cpuModel === "Custom Model..." ? (customCpuModel || "Custom") : cpuModel}</strong>
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                            {CPU_PRESETS.map((preset) => {
                              const isSelected = cpuModel === preset.model;
                              return (
                                <button
                                  key={preset.model}
                                  type="button"
                                  onClick={() => {
                                    setCpuModel(preset.model);
                                    if (preset.vendor && preset.vendor !== "CUSTOM") {
                                      setCpuVendor(preset.vendor);
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-indigo-500/20 border-indigo-500 ring-1 ring-indigo-500 shadow-sm"
                                      : "bg-zinc-900/60 border-zinc-800 hover:bg-zinc-800/80"
                                  }`}
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-white truncate">{preset.model}</span>
                                    <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-300 shrink-0 ml-1">
                                      {preset.tag}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-zinc-400 line-clamp-1">{preset.desc}</p>
                                </button>
                              );
                            })}
                          </div>

                          {cpuModel === "Custom Model..." && (
                            <div className="mt-2">
                              <label className="block text-[11px] font-bold text-zinc-300 mb-1">
                                Custom CPU Model String
                              </label>
                              <input
                                type="text"
                                value={customCpuModel}
                                onChange={(e) => setCustomCpuModel(e.target.value)}
                                placeholder="e.g. AMD EPYC 7763 64-Core Processor or Intel Core i9-14900KS"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          )}
                        </div>

                        {/* CPU Vendor Configuration */}
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2 flex items-center gap-1.5">
                            <ShieldCheck size={13} /> CPU Vendor ID String
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {CPU_VENDORS.map((v) => {
                              const isSelected = cpuVendor === v.id;
                              return (
                                <button
                                  key={v.id}
                                  type="button"
                                  onClick={() => setCpuVendor(v.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer border ${
                                    isSelected
                                      ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                                      : "bg-zinc-900/60 text-zinc-300 border-zinc-800 hover:text-white"
                                  }`}
                                >
                                  {v.label}
                                </button>
                              );
                            })}
                          </div>

                          {cpuVendor === "CUSTOM" && (
                            <div className="mt-2">
                              <input
                                type="text"
                                value={customVendorInput}
                                onChange={(e) => setCustomVendorInput(e.target.value)}
                                placeholder="Enter custom vendor (e.g. NovaCloud, CustomArch, KVMHost)"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          )}
                        </div>

                        {/* VM Credentials & System Parameters */}
                        <div className="pt-3 border-t border-indigo-500/20 space-y-4">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                            <Key size={13} /> VM Credentials & Access
                          </h4>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Hostname */}
                            <div>
                              <label className="block text-xs font-medium text-zinc-300 mb-1">
                                VM Hostname
                              </label>
                              <input
                                type="text"
                                value={vmHostname}
                                onChange={(e) => setVmHostname(e.target.value)}
                                placeholder={name ? name.toLowerCase().replace(/[^a-z0-9_-]/g, "-") : "cloud-vm-1"}
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                              />
                              <p className="text-[10px] text-zinc-500 mt-1">Hostname set inside the guest OS.</p>
                            </div>

                            {/* Username */}
                            <div>
                              <label className="block text-xs font-medium text-zinc-300 mb-1">
                                Default Sudo Username
                              </label>
                              <input
                                type="text"
                                value={vmUsername}
                                onChange={(e) => setVmUsername(e.target.value)}
                                placeholder="ubuntu"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                              />
                              <p className="text-[10px] text-zinc-500 mt-1">Default user created with sudo privileges.</p>
                            </div>

                            {/* Password */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium text-zinc-300">
                                  Root / User Password
                                </label>
                                <button
                                  type="button"
                                  onClick={generateRandomPassword}
                                  className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer font-medium"
                                >
                                  <RefreshCw size={11} /> Generate
                                </button>
                              </div>
                              <div className="relative">
                                <input
                                  type={showPassword ? "text" : "password"}
                                  value={vmPassword}
                                  onChange={(e) => setVmPassword(e.target.value)}
                                  placeholder="Enter password..."
                                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-3 pr-10 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white cursor-pointer"
                                  title={showPassword ? "Hide password" : "Show password"}
                                >
                                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-1">Cloud-init chpasswd password for SSH & console.</p>
                            </div>

                            {/* SSH Port */}
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium text-zinc-300">
                                  SSH Forwarding Port
                                </label>
                                {Number(sshPort) !== 2222 && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSshPort("2222");
                                      setPort("2222");
                                    }}
                                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                                  >
                                    Reset to 2222
                                  </button>
                                )}
                              </div>
                              <input
                                type="number"
                                value={sshPort}
                                onChange={(e) => {
                                  setSshPort(e.target.value);
                                  setPort(e.target.value);
                                }}
                                placeholder="2222"
                                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                              />
                              <p className="text-[10px] text-zinc-500 mt-1">Connect via: ssh -p {sshPort || 2222} {vmUsername || 'ubuntu'}@&lt;ip&gt;</p>
                            </div>
                          </div>

                          {/* GUI Mode toggle */}
                          <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                                <Monitor size={18} />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-white">Enable GUI Desktop Mode</div>
                                <div className="text-[10px] text-zinc-400">
                                  {guiMode ? "Virtual GTK GL display enabled (-display gtk,gl=on)" : "Headless mode enabled (-nographic -serial mon:stdio)"}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setGuiMode(!guiMode)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                                guiMode ? "bg-indigo-600" : "bg-zinc-800 border border-zinc-700"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  guiMode ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
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

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xl font-bold flex items-center"><Server className="w-5 h-5 mr-2 text-indigo-400" /> Server Details</h2>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
                    <Box size={13} className="text-indigo-400" />
                    <span>{type === "CUSTOM" ? (selectedEgg?.name || "Custom Egg") : type}</span>
                    <span className="text-indigo-400/60">•</span>
                    <span className="font-mono text-[11px]">{version}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground-muted mb-2">Server Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-muted-subtle border border-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 rounded-xl px-4 py-2 text-foreground transition-all shadow-inner outline-none"
                    placeholder={
                      type === "CUSTOM" && (selectedEgg?.id === "egg-qemu-cloud-vm" || selectedEgg?.category?.includes("Virtualization"))
                        ? "e.g. Ubuntu Cloud VM"
                        : isMinecraft 
                          ? "e.g. Survival SMP" 
                          : "e.g. Production Service"
                    }
                  />
                </div>
                
                {isMinecraft ? (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-1">
                    <div>
                      <label className="block text-sm font-medium text-foreground-muted mb-2 flex items-center">
                        <TerminalSquare className="w-4 h-4 mr-2 text-indigo-400" /> Server MOTD
                      </label>
                      <input
                        type="text"
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
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${cracked ? 'bg-red-500' : 'bg-muted-hover border border-border'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${cracked ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="p-3 bg-muted/40 rounded-xl border border-border-subtle text-xs text-muted-foreground flex items-center gap-2 mt-2">
                    <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                    <span>Non-Minecraft software selected. MOTD and Cracked mode are skipped.</span>
                  </div>
                )}
              </motion.div>
            )}
            
            {step === 3 && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
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

                {/* Custom CPU Model & Architecture Emulation */}
                <div className="bg-muted-subtle p-4 rounded-2xl border border-border-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-indigo-400" /> Virtual CPU Model & Vendor
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                          CUSTOMIZABLE
                        </span>
                      </h4>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Customize the CPU identity and vendor string exposed to the guest container.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCpuAdvanced(!showCpuAdvanced)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold px-2 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors"
                    >
                      {showCpuAdvanced ? "Hide Presets" : "Change Presets"}
                    </button>
                  </div>

                  <div className="p-3 bg-muted/60 rounded-xl border border-border-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                        <Cpu size={16} />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">
                          {cpuModel === "Custom Model..." ? (customCpuModel || "Custom CPU Model") : cpuModel}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                          <span>Vendor: <strong className="text-indigo-400">{cpuVendor === "CUSTOM" ? (customVendorInput || "Custom Vendor") : cpuVendor}</strong></span>
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 shrink-0">
                      Active Emulation
                    </span>
                  </div>

                  {showCpuAdvanced && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-3 pt-2 border-t border-border-subtle">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          Preloaded CPU Presets
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {CPU_PRESETS.map((preset) => {
                            const isSelected = cpuModel === preset.model;
                            return (
                              <button
                                key={preset.model}
                                type="button"
                                onClick={() => {
                                  setCpuModel(preset.model);
                                  if (preset.vendor && preset.vendor !== "CUSTOM") {
                                    setCpuVendor(preset.vendor);
                                  }
                                }}
                                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-indigo-500/15 border-indigo-500/50 ring-1 ring-indigo-500/40 shadow-sm"
                                    : "bg-muted/40 border-border hover:bg-muted/70"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-bold text-foreground truncate">{preset.model}</span>
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 shrink-0 ml-1">
                                    {preset.tag}
                                  </span>
                                </div>
                                <p className="text-[10px] text-muted-foreground line-clamp-1">{preset.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {cpuModel === "Custom Model..." && (
                        <div>
                          <label className="block text-[11px] font-bold text-foreground-muted mb-1">
                            Custom CPU Model Name
                          </label>
                          <input
                            type="text"
                            value={customCpuModel}
                            onChange={(e) => setCustomCpuModel(e.target.value)}
                            placeholder="e.g. AMD EPYC 7763 64-Core Processor or Intel Core i9-14900KS"
                            className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                          CPU Vendor ID Tag
                        </label>
                        <div className="flex flex-wrap gap-1.5">
                          {CPU_VENDORS.map((v) => {
                            const isSelected = cpuVendor === v.id;
                            return (
                              <button
                                key={v.id}
                                type="button"
                                onClick={() => setCpuVendor(v.id)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                                    : "bg-muted text-muted-foreground border-border hover:text-foreground"
                                }`}
                              >
                                {v.label}
                              </button>
                            );
                          })}
                        </div>

                        {cpuVendor === "CUSTOM" && (
                          <div className="mt-2">
                            <input
                              type="text"
                              value={customVendorInput}
                              onChange={(e) => setCustomVendorInput(e.target.value)}
                              placeholder="e.g. NovaCloud, CustomArch, KVMHost"
                              className="w-full bg-muted border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 4 && (
              <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
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
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {isMinecraft ? "Minecraft default is 25565. Bedrock default is 19132." : "Default SSH port is 2222. Web services default is 8080."}
                  </p>
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

                {/* Configuration Summary Card */}
                <div className="bg-muted-subtle p-4 rounded-2xl border border-border-subtle space-y-2.5 mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Configuration Review
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-card p-2.5 rounded-xl border border-border-subtle">
                      <span className="text-[10px] text-muted-foreground block">Server Name</span>
                      <span className="font-bold text-foreground truncate block">{name || "Untitled Server"}</span>
                    </div>
                    <div className="bg-card p-2.5 rounded-xl border border-border-subtle">
                      <span className="text-[10px] text-muted-foreground block">Engine / OS</span>
                      <span className="font-semibold text-foreground truncate block">{type === "CUSTOM" ? (selectedEgg?.name || "Custom") : type} ({version})</span>
                    </div>
                    <div className="bg-card p-2.5 rounded-xl border border-border-subtle">
                      <span className="text-[10px] text-muted-foreground block">Allocated RAM</span>
                      <span className="font-semibold text-indigo-400 truncate block">{ram} GB RAM</span>
                    </div>
                    <div className="bg-card p-2.5 rounded-xl border border-border-subtle">
                      <span className="text-[10px] text-muted-foreground block">Primary Port</span>
                      <span className="font-mono text-indigo-400 font-bold block">:{port}</span>
                    </div>
                  </div>
                </div>
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
