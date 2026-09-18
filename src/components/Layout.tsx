import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, ChevronRight, MessageSquare, AlertTriangle, User } from "lucide-react";
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
  const { user, openAccountModal } = useAuth();

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
  const isDiscordEnabled = Boolean(discordAddon?.enabled);
  const discordUrl = (discordAddon?.inviteUrl && discordAddon.inviteUrl.trim().length > 0) 
    ? discordAddon.inviteUrl.trim() 
    : "https://discord.gg";
  const discordPosition = discordAddon?.position || "Top-Right";

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
            {isDiscordEnabled && discordPosition === "Top-Right" && (
              <a 
                href={discordUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#5865F2]/15 text-[#5865F2] hover:bg-[#5865F2]/25 border border-[#5865F2]/30 transition-all text-xs sm:text-sm font-semibold shadow-sm"
                title="Join our Discord Community"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                {discordAddon.buttonStyle === "Labeled" ? (
                  <span className="hidden sm:inline">Join Discord</span>
                ) : (
                  <span className="hidden sm:inline">Discord</span>
                )}
              </a>
            )}
            <GlobalSearchModal />
            <NotificationsDropdown />
            <button
              id="header-user-account-btn"
              onClick={openAccountModal}
              className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-all text-xs font-medium border border-border/40 hover:border-border cursor-pointer group"
              title="Account Settings (Change Username, Email, Password)"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                {user?.username?.[0]?.toUpperCase() || <User size={13} />}
              </div>
              <span className="hidden sm:inline font-medium text-xs max-w-[100px] truncate">{user?.username}</span>
            </button>
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

        {isDiscordEnabled && discordPosition === "Bottom-Right" && (
          <a 
            href={discordUrl} 
            target="_blank" 
            rel="noreferrer"
            className="fixed bottom-6 right-6 p-3.5 sm:p-4 rounded-full bg-[#5865F2] text-white shadow-xl shadow-[#5865F2]/40 hover:bg-[#4752C4] hover:-translate-y-1 transition-all z-50 flex items-center justify-center group border border-white/10"
            title="Join our Discord Community"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            {discordAddon.buttonStyle === "Labeled" && (
              <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap pl-0 group-hover:pl-3 font-semibold text-sm">
                Join Discord
              </span>
            )}
          </a>
        )}
      </div>
    </div>
  );
}
