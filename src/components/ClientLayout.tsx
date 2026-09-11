import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { Search, Layers, Settings, LogOut, User } from "lucide-react";
import GlobalSearchModal from "./GlobalSearchModal";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { panelName } = useSettings();
  const location = useLocation();

  return (
    <div className="flex h-[100dvh] w-full bg-transparent text-foreground font-sans overflow-hidden flex-col">
      {/* Top Navbar */}
      <header className="h-16 flex items-center justify-between px-6 bg-[#21242d] border-b border-border-subtle shadow-md relative z-20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-white tracking-wide hover:text-indigo-400 transition-colors">
            {panelName}
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-6">
          <GlobalSearchModal />
          
          <div className="h-16 flex items-center gap-6 border-l border-border/20 pl-6 border-r pr-6">
            <Link to="/" className="text-muted-foreground hover:text-white transition-colors relative group">
              <Layers size={20} className={location.pathname === '/' ? "text-indigo-400" : ""} />
              {location.pathname === '/' && <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 w-8 h-1 bg-indigo-500 rounded-t-lg" />}
            </Link>
            <button className="text-muted-foreground hover:text-white transition-colors" title="Account">
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
      <main className="flex-1 w-full h-full relative z-0 overflow-x-hidden overflow-y-auto pb-safe custom-scrollbar">
        <div className="p-4 sm:p-5 max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
