import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Search, Layers, Settings, LogOut, User } from "lucide-react";
import GlobalSearchModal from "./GlobalSearchModal";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, openAccountModal } = useAuth();
  const { panelName, addons } = useSettings();
  const location = useLocation();

  const discordAddon = addons?.discord;
  const isDiscordEnabled = Boolean(discordAddon?.enabled);
  const discordUrl = (discordAddon?.inviteUrl && discordAddon.inviteUrl.trim().length > 0) 
    ? discordAddon.inviteUrl.trim() 
    : "https://discord.gg";
  const discordPosition = discordAddon?.position || "Top-Right";

  const footerAddon = addons?.footer;
  const isFooterEnabled = footerAddon?.enabled;
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex h-[100dvh] w-full bg-transparent text-foreground font-sans overflow-hidden flex-col">
      {/* Top Navbar */}
      <header className="h-16 flex items-center justify-between px-6 bg-[#21242d] border-b border-border-subtle shadow-md relative z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-white tracking-wide hover:text-indigo-400 transition-colors">
            {panelName}
          </Link>
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
          
          <div className="h-16 flex items-center gap-4 sm:gap-6 border-l border-border/20 pl-4 sm:pl-6 border-r pr-4 sm:pr-6">
            <Link to="/" className="text-muted-foreground hover:text-white transition-colors relative group">
              <Layers size={20} className={location.pathname === '/' ? "text-indigo-400" : ""} />
              {location.pathname === '/' && <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-t-lg" />}
            </Link>
            <button 
              id="client-header-account-btn"
              onClick={openAccountModal}
              className="text-muted-foreground hover:text-white transition-colors cursor-pointer" 
              title="Account Settings"
            >
              <User size={20} />
            </button>
            {(user?.role === "admin" || user?.role === "owner") && (
              <Link to="/admin" className="text-muted-foreground hover:text-white transition-colors" title="Admin Panel">
                <Settings size={20} />
              </Link>
            )}
            <button onClick={logout} className="text-muted-foreground hover:text-red-400 transition-colors" title="Logout">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full h-full relative z-0 overflow-x-hidden overflow-y-auto pb-safe custom-scrollbar flex flex-col">
        <div className="p-4 sm:p-5 max-w-6xl mx-auto w-full flex-1">
          {children}
        </div>

        {isFooterEnabled && (
          <footer className="w-full py-6 px-4 mt-auto border-t border-border-subtle bg-[#21242d]/80 text-center text-sm text-muted-foreground">
            {footerAddon.startYear}
            {footerAddon.endYear ? ` - ${footerAddon.endYear}` : ` - ${currentYear}`} {footerAddon.customText}
          </footer>
        )}
      </main>

      {/* Floating Bottom-Right Discord Button */}
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
  );
}
