import { Link, useLocation } from "react-router-dom";
import { Server, LayoutDashboard, Plus, LogOut, X, Settings, Key, User, Activity, Box, Search, Bell, Archive, Sliders, Puzzle, Palette } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { motion, AnimatePresence } from "framer-motion";

export function Sidebar({ onClose, isCollapsed, toggleCollapse }: { onClose?: () => void, isCollapsed?: boolean, toggleCollapse?: () => void }) {
  const location = useLocation();
  const { user, logout, openAccountModal } = useAuth();
  const { panelName, panelLogo, addons } = useSettings();

  const discordAddon = addons?.discord;
  const isDiscordEnabled = Boolean(discordAddon?.enabled);
  const discordUrl = (discordAddon?.inviteUrl && discordAddon.inviteUrl.trim().length > 0)
    ? discordAddon.inviteUrl.trim()
    : "https://discord.gg";
  
  const links = [
    { name: "My Servers", path: "/", icon: <Server size={18} /> },
    { name: "Overview", path: "/admin", icon: <LayoutDashboard size={18} /> },
    { name: "Nodes", path: "/nodes", icon: <Activity size={18} /> },

  ];
  
  if (user?.role === "admin") {
    links.push({ name: "Create", path: "/servers/create", icon: <Plus size={18} /> });
    links.push({ name: "Manage", path: "/admin/servers", icon: <Box size={18} /> });
    links.push({ name: "Options", path: "/admin/options", icon: <Sliders size={18} /> });
    links.push({ name: "Customization", path: "/admin/customization", icon: <Palette size={18} /> });
    links.push({ name: "Addons", path: "/admin/addons", icon: <Puzzle size={18} /> });
    links.push({ name: "Backups", path: "/admin/backups", icon: <Archive size={18} /> });
    links.push({ name: "Users", path: "/users", icon: <User size={18} /> });
    links.push({ name: "API Keys", path: "/api-keys", icon: <Key size={18} /> });
  }
  links.push({ name: "Settings", path: "/settings", icon: <Settings size={18} /> });

  return (
    <div className={`h-full flex flex-col bg-card/80 backdrop-blur-xl border-r border-border transition-all duration-300 z-20 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className={`h-14 flex items-center border-b border-border-subtle ${isCollapsed ? 'justify-center' : 'px-6'} flex-shrink-0 relative`}>
        {onClose && (
          <button onClick={onClose} className="md:hidden flex items-center justify-center absolute top-5 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
            <X size={18} />
          </button>
        )}
        <div className="flex items-center gap-3">
          {panelLogo ? (
            <img src={panelLogo} alt="Logo" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shadow-sm flex-shrink-0 text-white">
              <Server className="w-4 h-4" />
            </div>
          )}
          {!isCollapsed && (
            <motion.h1 
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-lg font-bold text-foreground tracking-tight truncate whitespace-nowrap"
            >
              {panelName}
            </motion.h1>
          )}
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 w-full px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
        {!isCollapsed && <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Menu</p>}
        {links.map(link => {
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
          return (
            <Link 
              key={link.path} 
              to={link.path} 
              onClick={onClose}
              title={isCollapsed ? link.name : undefined}
              className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-1.5 rounded-md transition-colors group overflow-hidden`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTabSidebar" 
                  className="absolute inset-0 bg-muted-hover rounded-lg" 
                  initial={false} 
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              {isActive && !isCollapsed && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-indigo-500 rounded-r-full" />
              )}
              <div className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-muted-foreground group-hover:text-foreground'}`}>
                {link.icon}
              </div>
              {!isCollapsed && (
                <span className={`ml-3 relative z-10 font-medium text-sm transition-colors duration-200 ${isActive ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>
                  {link.name}
                </span>
              )}
            </Link>
          );
        })}

        {isDiscordEnabled && (
          <a 
            href={discordUrl} 
            target="_blank" 
            rel="noreferrer"
            onClick={onClose}
            title={isCollapsed ? "Join Discord" : undefined}
            className={`relative flex items-center ${isCollapsed ? 'justify-center' : 'px-3'} py-1.5 rounded-md transition-all group overflow-hidden text-[#5865F2] hover:bg-[#5865F2]/10 mt-2`}
          >
            <div className="relative z-10 shrink-0">
              <svg className="w-[18px] h-[18px] fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </div>
            {!isCollapsed && (
              <span className="ml-3 relative z-10 font-medium text-sm flex items-center gap-1.5">
                Discord
                <span className="text-[10px] bg-[#5865F2]/20 text-[#5865F2] font-bold px-1.5 py-0.2 rounded-full border border-[#5865F2]/30 uppercase">Chat</span>
              </span>
            )}
          </a>
        )}
      </nav>
      
      {/* User Profile */}
      <div className="w-full p-3 border-t border-border-subtle mt-auto bg-transparent">
        {isCollapsed ? (
          <div className="flex flex-col gap-2 items-center">
            <button 
              id="sidebar-collapsed-account-btn"
              onClick={() => {
                if (onClose) onClose();
                openAccountModal();
              }} 
              title="Account Settings" 
              className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm hover:ring-2 hover:ring-indigo-400 transition-all cursor-pointer"
            >
              {user?.username?.[0]?.toUpperCase() || <User size={16} />}
            </button>
            <button onClick={logout} title="Logout" className="flex items-center justify-center w-full p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors cursor-pointer">
              <LogOut size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <button 
              id="sidebar-user-account-btn"
              onClick={() => {
                if (onClose) onClose();
                openAccountModal();
              }}
              className="flex items-center gap-3 overflow-hidden text-left p-1.5 -ml-1 rounded-lg hover:bg-muted/70 transition-colors flex-1 group cursor-pointer"
              title="Account Settings (Click to edit username, email & password)"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <div className="truncate">
                <p className="font-semibold text-foreground text-sm truncate group-hover:text-indigo-400 transition-colors flex items-center gap-1.5">
                  {user?.username}
                  <Settings size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-400 shrink-0" />
                </p>
                <p className="text-xs text-muted-foreground capitalize truncate">{user?.role || "Admin"}</p>
              </div>
            </button>
            <button onClick={logout} className="p-2 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors flex-shrink-0 cursor-pointer" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
