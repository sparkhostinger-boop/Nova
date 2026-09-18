// @ts-nocheck
import React, { useEffect, useState } from "react"; 
import { LoadingOverlay } from "../components/LoadingOverlay";
import { useParams, Link, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  Terminal, Folder, Database, Calendar, Users, Disc, Network, Plug, Settings, Activity,
  Play, Square, RefreshCw, ArrowLeft, Archive, AlertTriangle, Copy, Check, Menu, X, LogOut, Lock,
  Home, User, Sliders, Puzzle, Globe, ChevronRight, Server as ServerIcon, Shield
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ServerConsole from "../components/ServerConsole";
import FileManager from "../components/FileManager";
import ServerSettings from "../components/ServerSettings";
import ServerProperties from "../components/ServerProperties";
import ServerBackups from "../components/ServerBackups";
import PluginManager from "../components/PluginManager";
import ModManager from "../components/ModManager";
import SubUsersManager from "../components/SubUsersManager";
import PlayerManager from "../components/PlayerManager";
import ServerSFTP from "../components/ServerSFTP";
import PlayitTunnel from "./PlayitTunnel";
import { useSettings } from "../context/SettingsContext";

export default function ServerView() {
  const { id } = useParams();
  const { enablePlayit } = useSettings();
  const [server, setServer] = useState<any>(null);
  const [totalSystemRam, setTotalSystemRam] = useState<number>(0);
  const [showRamWarning, setShowRamWarning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedIp, setCopiedIp] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const handleCopyIp = () => {
    if (!server) return;
    const alias = server.ipAlias?.trim();
    const textToCopy = alias 
      ? (alias.includes(':') ? alias : `${alias}:${server.port || "25565"}`) 
      : `${server.port || "25565"}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2000);
  };

  const fetchServer = async () => {
    try {
      const { data } = await axios.get(`/api/servers/${id}`);
      setServer(data);
    } catch (error) {
      console.error("Error fetching server:", error);
    }
  };

  const fetchSystemRam = async () => {
    try {
      const { data } = await axios.get('/api/system/metrics');
      if (data && data.ram) {
        setTotalSystemRam(data.ram.total);
      }
    } catch (error) {
      console.error("Error fetching system ram:", error);
    }
  };

  useEffect(() => {
    fetchServer();
    fetchSystemRam();
    const interval = setInterval(fetchServer, 3000);
    return () => clearInterval(interval);
  }, [id]);

  const executeAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!server) return;
    try {
      setIsProcessing(true);
      await axios.post(`/api/servers/${server.id}/${action}`);
      await fetchServer();
    } catch (error) {
      console.error(`Error performing ${action}:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAction = (action: 'start' | 'stop' | 'restart') => {
    if (action === 'start' && server && server.ram > totalSystemRam && totalSystemRam > 0) {
      setShowRamWarning(true);
      return;
    }
    executeAction(action);
  };

  if (!server) {
    return (
      <div className="flex items-center justify-center h-[100dvh] bg-zinc-950">
        <div className="w-8 h-8 border-4 border-[#fb4242] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const tabs = [
    { name: 'Terminal', path: `/servers/${id}`, icon: <Terminal size={20} /> },
    { name: 'File Manager', path: `/servers/${id}/files`, icon: <Folder size={20} /> },
    { name: 'Player Manager', path: `/servers/${id}/players`, icon: <Users size={20} /> },
    { name: 'Properties', path: `/servers/${id}/properties`, icon: <Sliders size={20} /> },
    { name: 'SFTP Details', path: `/servers/${id}/sftp`, icon: <Network size={20} /> },
    { name: 'Sub-Users', path: `/servers/${id}/subusers`, icon: <Shield size={20} /> },
    { name: 'Plugins', path: `/servers/${id}/plugins`, icon: <Puzzle size={20} /> },
    { name: 'Mods', path: `/servers/${id}/mods`, icon: <Plug size={20} /> },
    { name: 'Backup', path: `/servers/${id}/backup`, icon: <Archive size={20} /> },
    { name: 'Settings', path: `/servers/${id}/settings`, icon: <Settings size={20} /> },
    ...(enablePlayit ? [{ name: 'Playit Tunnel', path: `/servers/${id}/playit`, icon: <Globe size={20} /> }] : []),
  ];

  const currentTab = tabs.find(tab => 
    tab.name === 'Terminal' 
      ? location.pathname === tab.path 
      : location.pathname.startsWith(tab.path)
  ) || tabs[0];

  const getStatusColor = () => {
    if (server.status === 'online') return '#42e33d';
    if (server.status === 'starting' || server.status === 'restarting') return '#e8bd15';
    return '#fb4242';
  };

  return (
    <div className="flex h-[100dvh] w-full bg-zinc-950 text-[#e9eaee] font-sans overflow-hidden">
      
      {/* Mobile Sidebar Backdrop Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-opacity" 
            onClick={() => setSidebarOpen(false)} 
          />
        )}
      </AnimatePresence>

      {/* Mobile Slide-Out Navigation Drawer */}
      <div 
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[290px] max-w-[85vw] bg-zinc-950 border-r border-zinc-800 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/30">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/5 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <ServerIcon size={18} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-white truncate">{server.name || "Server"}</div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#a1a1aa]">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getStatusColor() }} />
                <span className="capitalize">{server.status || "offline"}</span>
                <span className="text-[#52525b]">•</span>
                <span className="text-[#d4d4d8] font-mono">{server.port || "25565"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-[#a1a1aa] hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Section Title */}
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717a]">Server Menu</span>
        </div>

        {/* Server Tabs Navigation List */}
        <div className="flex-1 px-3 py-1 overflow-y-auto overflow-x-hidden no-scrollbar flex flex-col gap-1">
          {tabs.map(tab => {
            const isActive = tab.name === 'Terminal' 
              ? location.pathname === tab.path 
              : location.pathname.startsWith(tab.path);
            
            return (
              <Link
                key={tab.name}
                to={tab.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all font-medium text-sm min-h-[44px]
                  ${isActive 
                    ? 'bg-rose-500/15 border border-rose-500/30 text-white shadow-sm font-semibold' 
                    : 'text-[#d4d4d8] hover:text-white hover:bg-[#1a1818]'}`}
              >
                <div className={`shrink-0 ${isActive ? 'text-rose-400' : 'text-[#a1a1aa]'}`}>
                  {tab.icon}
                </div>
                <span className="truncate">{tab.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-400" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Drawer Bottom Quick Navigation */}
        <div className="p-3 border-t border-zinc-800 bg-[#0e0d0f] flex flex-col gap-1">
          <Link 
            to="/" 
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#a1a1aa] hover:text-white hover:bg-[#1a1818] transition-colors"
          >
            <Home size={18} />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/admin/servers" 
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#a1a1aa] hover:text-white hover:bg-[#1a1818] transition-colors"
          >
            <Settings size={18} />
            <span>Manage Servers</span>
          </Link>
          <Link 
            to="/settings" 
            onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#a1a1aa] hover:text-white hover:bg-[#1a1818] transition-colors"
          >
            <User size={18} />
            <span>Account Settings</span>
          </Link>
        </div>
      </div>

      {/* Desktop Server Management Sidebar (Visible on md and larger) */}
      <aside className="hidden md:flex w-[240px] flex-col h-full bg-[#0d0f14] border-r border-zinc-800/80 relative shrink-0 z-30 select-none">
        
        {/* Top: Back to Dashboard & Server Info */}
        <div className="p-3.5 pb-2.5 border-b border-zinc-800/60 flex flex-col gap-2.5">
          {/* Back to Dashboard Link */}
          <Link
            to="/"
            className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors group px-1"
            title="Back to Dashboard"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Dashboard</span>
          </Link>

          {/* Server Info Header Card */}
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 shrink-0">
              <ServerIcon size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate" title={server.name || "Server"}>
                {server.name || "Server"}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse"
                  style={{ backgroundColor: getStatusColor() }}
                />
                <span className="capitalize">{server.status || "offline"}</span>
                <span className="text-zinc-600">•</span>
                <span className="font-mono text-[10px] text-zinc-300">{server.port || "25565"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Section Title */}
        <div className="px-4 pt-3 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
            Server Options
          </span>
        </div>

        {/* Server Tabs Navigation List with Names and NO SCROLLBAR */}
        <div className="flex-1 px-2.5 py-1 overflow-y-auto no-scrollbar flex flex-col gap-1">
          {tabs.map(tab => {
            const isActive = tab.name === 'Terminal' 
              ? location.pathname === tab.path 
              : location.pathname.startsWith(tab.path);
            
            return (
              <Link
                key={tab.name}
                to={tab.path}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all font-medium text-xs
                  ${isActive 
                    ? 'bg-rose-500/15 border border-rose-500/30 text-white shadow-sm font-semibold' 
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/60 border border-transparent'}`}
              >
                <div className={`shrink-0 ${isActive ? 'text-rose-400' : 'text-zinc-400'}`}>
                  {React.cloneElement(tab.icon, { size: 16 })}
                </div>
                <span className="truncate">{tab.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-rose-400" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Desktop Sidebar Bottom Quick Navigation */}
        <div className="p-2.5 border-t border-zinc-800/60 bg-zinc-950/40 flex flex-col gap-1">
          <Link 
            to="/admin/servers" 
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <Settings size={15} className="text-zinc-400" />
            <span className="truncate">Manage Servers</span>
          </Link>
          <Link 
            to="/settings" 
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors"
          >
            <User size={15} className="text-zinc-400" />
            <span className="truncate">Account</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden min-w-0 relative bg-zinc-950">
        <style dangerouslySetInnerHTML={{__html: `
          .server-bg-grid {
              position:absolute; inset:0; z-index:0; pointer-events:none;
              background-image:
                  linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
              background-size:40px 40px;
              mask-image:radial-gradient(ellipse 80% 80% at 50% 0%, #000 20%, transparent 100%);
          }
          .server-noise {
              position:absolute; inset:0; z-index:10; pointer-events:none; opacity:.02;
              background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          }
        `}} />
        <div className="server-noise" />
        <div className="server-bg-grid" />

        
        {/* Mobile Navigation Header Bar (Visible on mobile < md) */}
        <header className="md:hidden flex items-center justify-between px-3.5 py-2.5 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800 z-30 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              id="mobile-server-sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-1 text-[#e4e4e7] hover:text-white bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors flex items-center justify-center touch-manipulation min-w-[40px] min-h-[40px]"
              aria-label="Open server menu"
            >
              <Menu size={20} />
            </button>
            
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 animate-pulse"
                style={{ backgroundColor: getStatusColor() }}
              />
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate max-w-[130px] sm:max-w-[200px]">
                  {server.name || "Server"}
                </span>
                <span className="text-[11px] text-[#a1a1aa] truncate flex items-center gap-1">
                  <span>{currentTab.name}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleCopyIp}
              className="px-2.5 py-1.5 text-xs font-medium bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 text-[#d4d4d8] hover:text-white rounded-lg transition-colors flex items-center gap-1.5 touch-manipulation min-h-[36px]"
              title="Copy Address"
            >
              {copiedIp ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
              <span className="hidden xs:inline">{copiedIp ? "Copied" : "Address"}</span>
            </button>

            <Link
              to="/"
              className="p-2 text-[#a1a1aa] hover:text-white bg-zinc-900/50 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors flex items-center justify-center min-w-[36px] min-h-[36px]"
              title="Dashboard"
            >
              <Home size={16} />
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto relative z-20">
          <Routes>
            <Route path="/" element={<ServerConsole serverId={id!} server={server} />} />
            <Route path="/players" element={<PlayerManager serverId={id!} />} />
            <Route path="/properties" element={<ServerProperties serverId={id!} />} />
            <Route path="/files" element={<FileManager serverId={id!} />} />
            <Route path="/sftp" element={<ServerSFTP serverId={id!} server={server} />} />
            <Route path="/subusers" element={<SubUsersManager serverId={id!} />} />
            <Route path="/settings" element={<ServerSettings serverId={id!} server={server} />} />
            <Route path="/backup" element={<ServerBackups serverId={id!} />} />
            <Route path="/plugins" element={<PluginManager serverId={id!} />} />
            <Route path="/mods" element={<ModManager serverId={id!} />} />
            {enablePlayit && <Route path="/playit" element={<PlayitTunnel serverId={id!} />} />}
          </Routes>
        </div>
      </div>

      <AnimatePresence>
        {showRamWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[#121214] border border-rose-500/30 shadow-2xl shadow-red-500/10 rounded-2xl p-5 max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-amber-500" />
              <div className="flex items-start mb-4">
                <div className="bg-red-500/10 p-3 rounded-full mr-4">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">High RAM Allocation</h3>
                  <p className="text-white text-sm leading-relaxed">
                    This server is configured to use up to <strong className="text-white">{server?.ram}GB</strong> of RAM, but this system only has <strong className="text-white">{totalSystemRam.toFixed(1)}GB</strong> physically available. 
                  </p>
                  <p className="text-white text-sm leading-relaxed mt-2">
                    The container uses memory on-demand, but if actual memory usage exceeds the host's physical RAM, the server will crash/be terminated by the OS.
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRamWarning(false)}
                  className="px-4 py-2 bg-[#1c1818] hover:bg-[#252020] text-white font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowRamWarning(false);
                    executeAction('start');
                  }}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-rose-400 font-bold rounded-xl transition-colors border border-rose-500/30"
                >
                  Start Anyway
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
