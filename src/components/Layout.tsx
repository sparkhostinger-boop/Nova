import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, ChevronRight, MessageSquare, AlertTriangle } from "lucide-react";
import { useLocation, matchPath, Link, Navigate } from "react-router-dom";
import GlobalSearchModal from "./GlobalSearchModal";
import NotificationsDropdown from "./NotificationsDropdown";
import ClientLayout from "./ClientLayout";
import { useSettings } from "../context/SettingsContext";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const { addons } = useSettings();
  const { user } = useAuth();

  const isServerView = matchPath("/servers/:id/*", location.pathname) && !matchPath("/servers/create", location.pathname);
  const isClientServerList = location.pathname === "/";

  const getBreadcrumb = () => {
    const path = location.pathname;
    if (path === '/') return 'Overview';
    if (path === '/servers') return 'Servers';
    if (path === '/servers/create') return 'Create Server';
    if (path.startsWith('/servers/')) return 'Server Management';
    if (path === '/admin/servers') return 'Manage';
    if (path === '/admin/options' || path === '/options') return 'Options';
    if (path === '/admin/addons' || path === '/addons') return 'Addons';
    if (path === '/admin/backups' || path === '/backups') return 'Backups';
    if (path === '/users') return 'Users';
    if (path === '/nodes') return 'Nodes';
    if (path === '/settings') return 'Settings';
    if (path === '/api-keys') return 'API Keys';
    return '';
  };

  const currentYear = new Date().getFullYear();
  const footerAddon = addons?.footer;
  const isFooterEnabled = footerAddon?.enabled;
  
  const discordAddon = addons?.discord;
  const isDiscordEnabled = discordAddon?.enabled;

  const maintenanceAddon = addons?.maintenance;
  const isMaintenanceEnabled = maintenanceAddon?.enabled;

  if (isMaintenanceEnabled && user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6">
        <AlertTriangle size={64} className="text-amber-500 mb-6" />
        <h1 className="text-3xl font-bold text-foreground mb-4">Under Maintenance</h1>
        <p className="text-muted-foreground text-center max-w-md">
          {maintenanceAddon?.message || "The panel is currently down for maintenance. Please check back later."}
        </p>
        {maintenanceAddon?.timer && (
           <div className="mt-8 p-4 bg-card border border-border rounded-xl">
             <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest text-center">Expected Return</p>
             <p className="text-xl font-bold text-foreground mt-2">{new Date(maintenanceAddon.timer).toLocaleString()}</p>
           </div>
        )}
      </div>
    );
  }

  if (isClientServerList) {
    return <ClientLayout>{children}</ClientLayout>;
  }
  
  if (isServerView) {
    return (
      <div className="flex h-[100dvh] w-full bg-transparent text-foreground font-sans overflow-hidden selection:bg-indigo-500/30">
        <main className="flex-1 w-full h-full relative z-10 overflow-hidden">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className={`flex h-[100dvh] w-full bg-transparent text-foreground font-sans overflow-hidden selection:bg-indigo-500/30`}>
      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Sidebar Container */}
      <div className={`fixed inset-y-0 left-0 z-50 transform flex-shrink-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out`}>
        <Sidebar onClose={() => setMobileOpen(false)} isCollapsed={isCollapsed} toggleCollapse={() => setIsCollapsed(!isCollapsed)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative bg-transparent">
        
        {isMaintenanceEnabled && user?.role === "admin" && (
          <div className="bg-amber-500 text-black px-4 py-2 text-sm font-semibold text-center flex items-center justify-center gap-2">
            <AlertTriangle size={16} />
            Maintenance mode is currently active. Only admins can access the panel.
          </div>
        )}

        {/* Top Header */}
        <header className="h-14 flex items-center justify-between px-4 sm:px-6 bg-card/80 backdrop-blur-xl border-b border-border-subtle relative z-10 flex-shrink-0">
          <div className="flex items-center gap-4">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            <button onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex p-2 -ml-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors">
              <Menu size={20} />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span className="text-foreground">{getBreadcrumb()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            {isDiscordEnabled && discordAddon?.position === "Top-Right" && discordAddon?.inviteUrl && (
              <a 
                href={discordAddon.inviteUrl} 
                target="_blank" 
                rel="noreferrer"
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#5865F2]/10 text-[#5865F2] hover:bg-[#5865F2]/20 transition-colors text-sm font-semibold"
              >
                <MessageSquare size={16} />
                {discordAddon.buttonStyle === "Labeled" ? "Join Discord" : ""}
              </a>
            )}
            <GlobalSearchModal />
            <NotificationsDropdown />
          </div>
        </header>
        
        {/* Main Content */}
        <main className={`flex-1 w-full h-full relative z-0 overflow-x-hidden overflow-y-auto pb-safe custom-scrollbar flex flex-col`}>
          <div className="p-4 sm:p-5 max-w-7xl mx-auto w-full flex-1">
            {children}
          </div>
          
          {isFooterEnabled && (
            <footer className="w-full py-6 px-4 mt-auto border-t border-border-subtle bg-card/50 text-center text-sm text-muted-foreground">
              {footerAddon.startYear}
              {footerAddon.endYear ? ` - ${footerAddon.endYear}` : ` - ${currentYear}`} {footerAddon.customText}
            </footer>
          )}
        </main>

        {isDiscordEnabled && discordAddon?.position === "Bottom-Right" && discordAddon?.inviteUrl && (
          <a 
            href={discordAddon.inviteUrl} 
            target="_blank" 
            rel="noreferrer"
            className="fixed bottom-6 right-6 p-4 rounded-full bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/40 hover:bg-[#4752C4] hover:-translate-y-1 transition-all z-50 flex items-center justify-center group"
          >
            <MessageSquare size={24} />
            {discordAddon.buttonStyle === "Labeled" && (
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap pl-0 group-hover:pl-3 font-semibold">
                Join Discord
              </span>
            )}
          </a>
        )}
      </div>
    </div>
  );
}
