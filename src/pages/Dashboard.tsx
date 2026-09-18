import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Terminal, MapPin, Shield, ArrowRight, Server, Box, Activity } from 'lucide-react';
import { useDashboardData } from '../hooks/useDashboardData';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { servers: rawServers } = useDashboardData();
  const realServers = Array.isArray(rawServers) ? rawServers : [];
  const { panelName } = useSettings();
  
  const pName = panelName || 'SH PANEL';
  const nameParts = pName.split(' ');
  const firstWord = nameParts[0]?.toUpperCase() || 'SH';
  const restWords = nameParts.slice(1).join(' ').toUpperCase();

  // Scroll reveal animation
  useEffect(() => {
    const mainEl = document.querySelector('main');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting) {
                e.target.classList.add('active');
                observer.unobserve(e.target);
            }
        });
    }, { root: mainEl || null, threshold: 0.1, rootMargin: '0px 0px -20px 0px' });
    
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [realServers]);

  const myServers = useMemo(() => {
    if (!user) return [];
    return realServers.filter(s => {
      if (!s.owner) return false;
      return s.owner === user.id || s.owner === user.username || s.owner === user.email;
    });
  }, [realServers, user]);

  const operatorServers = useMemo(() => {
    if (!user) return [];
    return realServers.filter(s => {
      return s.owner && s.owner !== user.id && s.owner !== user.username && s.owner !== user.email;
    });
  }, [realServers, user]);

  const { addons } = useSettings();
  const analyticsAddon = addons?.analytics;
  const showAnalytics = analyticsAddon?.enabled && (analyticsAddon.visibility === "Public" || user?.role === "admin");

  const discordAddon = addons?.discord;
  const showDiscordDashboard = Boolean(discordAddon?.enabled) && discordAddon?.position === "Dashboard";
  const discordUrl = (discordAddon?.inviteUrl && discordAddon.inviteUrl.trim().length > 0)
    ? discordAddon.inviteUrl.trim()
    : "https://discord.gg";

  const renderServerCard = (s: any, index: number, isAdminView: boolean = false) => {
    const checkStr = `${s.type || ''} ${s.software || ''} ${s.name || ''} ${s.version || ''}`.toLowerCase();
    const isPaper = checkStr.includes('paper');
    const isVelocity = checkStr.includes('velocity');
    const isOnline = s.status === 'online' || s.status === 'ONLINE' || s.status === 'running';
    const typeLabel = s.type || s.software || 'Unknown';
    
    return (
      <article 
        key={s.id} 
        onClick={() => navigate(`/servers/${s.id}`)}
        className={`reveal group relative overflow-hidden flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-4 rounded-2xl p-5 cursor-pointer transition-all duration-300 border bg-zinc-950/40 backdrop-blur-md ${
            isOnline 
            ? 'hover:bg-zinc-900/80 border-theme-500/30 hover:border-theme-400/60 shadow-[0_4px_20px_rgba(var(--theme-rgb-500),0.05)] hover:shadow-[0_8px_30px_rgba(var(--theme-rgb-500),0.15)]' 
            : 'hover:bg-zinc-900/60 border-zinc-800/50 hover:border-zinc-700 shadow-sm'
        }`} 
        style={{transitionDelay: `${(index % 10) * 50}ms`}}
      >
        {isPaper && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 z-0">
            <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto object-contain" />
          </div>
        )}
        {isVelocity && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 z-0">
            <img src="https://assets.papermc.io/brand/velocity_combination_mark_blue.min.svg" alt="Velocity" className="h-16 w-auto object-contain brightness-0 invert opacity-95" />
          </div>
        )}
        <div className="relative z-10 contents">
        {/* Rank / Index */}
        <div className="hidden md:flex md:col-span-1 justify-center font-display font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-br from-theme-500 to-zinc-600 opacity-40 group-hover:opacity-100 transition-opacity">
            {String(index + 1).padStart(2, '0')}
        </div>
        
        {/* Name & ID */}
        <div className="w-full md:col-span-4 lg:col-span-4">
            <h3 className="font-display font-bold text-xl md:text-2xl tracking-tight text-white group-hover:text-white transition-colors truncate flex items-center gap-2">
                {s.name}
            </h3>
            <p className="font-mono text-[11px] text-white mt-1.5 flex items-center gap-2">
                <Server className="w-3.5 h-3.5" />
                <span className="truncate">{s.id.split('-')[0].toUpperCase()}</span>
                <span className="text-white">//</span>
                <span className="bg-zinc-800/50 text-white px-2 py-0.5 rounded border border-zinc-700/50 truncate max-w-[100px]">{typeLabel}</span>
            </p>
        </div>
        
        {/* Status / Node */}
        <div className="w-full md:col-span-5 lg:col-span-5 flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-4 sm:gap-6 mt-2 md:mt-0">
            <div className="flex flex-col min-w-[100px]">
                <span className="font-mono text-[10px] text-white tracking-widest mb-1.5">STATUS</span>
                <span className={`flex items-center gap-2 font-mono text-xs font-bold tracking-widest uppercase ${isOnline ? 'text-theme-400' : 'text-white'}`}>
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-theme-500 animate-pulse shadow-[0_0_8px_var(--color-theme-500)]' : 'bg-zinc-600'}`}></span>
                    {s.status || 'UNKNOWN'}
                </span>
            </div>
            <div className="flex flex-col">
                 <span className="font-mono text-[10px] text-white tracking-widest mb-1.5">NODE</span>
                 <span className="font-mono text-xs text-white flex items-center gap-1.5">
                     <MapPin className="w-3.5 h-3.5 text-white" />
                     {s.nodeId || 'Local'}
                 </span>
            </div>
            {isAdminView && s.owner && (
                <div className="flex flex-col">
                     <span className="font-mono text-[10px] text-white tracking-widest mb-1.5">OWNER</span>
                     <span className="font-mono text-xs text-white truncate max-w-[120px] flex items-center gap-1.5">
                         <Shield className="w-3.5 h-3.5 text-theme-600" />
                         {s.owner}
                     </span>
                </div>
            )}
        </div>
        
        {/* Action */}
        <div className="w-full md:col-span-2 lg:col-span-2 flex items-center justify-end mt-4 md:mt-0">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-theme-500/10 group-hover:border-theme-500/30 transition-all duration-300">
                <ArrowRight className="w-5 h-5 text-white group-hover:text-theme-400 group-hover:translate-x-1 transition-all duration-300" />
            </div>
        </div>
        </div>
      </article>
    );
  };

  return (
    <div className="text-white font-body min-h-full relative selection:bg-theme-600 selection:text-white pb-20">
      <style dangerouslySetInnerHTML={{__html: `
        .bg-grid {
            position:absolute; inset:0; z-index:0; pointer-events:none;
            background-image:
                linear-gradient(rgba(var(--theme-rgb-600),.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(var(--theme-rgb-600),.04) 1px, transparent 1px);
            background-size:56px 56px;
            -webkit-mask-image:radial-gradient(ellipse 95% 75% at 50% 0%, #000 35%, transparent 85%);
                    mask-image:radial-gradient(ellipse 95% 75% at 50% 0%, #000 35%, transparent 85%);
        }
        .noise {
            position:absolute; inset:0; z-index:60; pointer-events:none; opacity:.025;
            background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .reveal { opacity:0; transform:translateY(24px); transition:opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.active { opacity:1; transform:translateY(0); }
      `}} />

      <div className="noise" />
      <div className="bg-grid" />

      <div className="relative z-10">
        
        {/* HEADER */}
        <header className="max-w-7xl mx-auto px-4 md:px-5 pt-8 pb-8">
            <div className="reveal active max-w-4xl">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-theme-600/10 border border-theme-600/30 text-theme-500 font-mono text-xs tracking-wider mb-6 shadow-[0_0_15px_rgba(var(--theme-rgb-600),0.15)]">
                    <Terminal className="w-3.5 h-3.5 text-white" />
                    <span>WELCOME BACK, <span className="text-theme-500 font-bold uppercase">{user?.username || 'COMMANDER'}</span></span>
                </div>

                <h1 className="font-display font-bold leading-[0.85] tracking-tight text-[clamp(2.5rem,5vw,4.5rem)] uppercase">
                    <span className="block bg-gradient-to-r from-white via-zinc-100 to-zinc-300 bg-clip-text text-transparent">{firstWord}</span>
                    {restWords && (
                        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-theme-500 via-zinc-100 to-theme-500 drop-shadow-[0_0_30px_rgba(var(--theme-rgb-600),0.2)]">{restWords}</span>
                    )}
                </h1>
            </div>
        </header>

        {showAnalytics && (
          <div className="max-w-7xl mx-auto px-4 md:px-5 mb-10 reveal active">
            <h2 className="font-mono text-sm tracking-[0.2em] text-theme-500 flex items-center gap-3 mb-6">
                <span className="w-2 h-2 rounded-full bg-theme-500 animate-pulse"></span>
                SYSTEM ANALYTICS
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/30">Alpha</span>
                <span className="flex-1 h-px bg-gradient-to-r from-theme-500/50 to-transparent"></span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-950/40 border border-zinc-800 p-5 rounded-2xl backdrop-blur-md">
                <div className="text-xs font-mono text-zinc-400 mb-2 uppercase tracking-widest">Network Status</div>
                <div className="text-2xl font-bold font-display text-emerald-400 flex items-center gap-2">
                  <Activity size={24} /> Optimal
                </div>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-800 p-5 rounded-2xl backdrop-blur-md">
                <div className="text-xs font-mono text-zinc-400 mb-2 uppercase tracking-widest">Global Memory</div>
                <div className="text-2xl font-bold font-display text-white">42% <span className="text-sm font-medium text-zinc-500">Allocated</span></div>
              </div>
              <div className="bg-zinc-950/40 border border-zinc-800 p-5 rounded-2xl backdrop-blur-md">
                <div className="text-xs font-mono text-zinc-400 mb-2 uppercase tracking-widest">Active Instances</div>
                <div className="text-2xl font-bold font-display text-theme-400">{realServers.filter(s => s.status === 'online').length} / {realServers.length}</div>
              </div>
            </div>
          </div>
        )}

        {showDiscordDashboard && (
          <div className="max-w-7xl mx-auto px-4 md:px-5 mb-8 reveal active">
            <div className="relative overflow-hidden bg-gradient-to-r from-[#5865F2]/20 via-zinc-900/60 to-zinc-950/80 border border-[#5865F2]/30 p-6 rounded-2xl backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-[#5865F2]/10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#5865F2] flex items-center justify-center text-white shadow-md shadow-[#5865F2]/40 shrink-0">
                  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">Join Our Discord Community</h3>
                  <p className="text-sm text-zinc-400 mt-0.5">Connect with members, receive announcements, and get fast community support.</p>
                </div>
              </div>
              <a 
                href={discordUrl} 
                target="_blank" 
                rel="noreferrer"
                className="px-5 py-2.5 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-sm transition-all shadow-md shadow-[#5865F2]/30 flex items-center gap-2 shrink-0 self-stretch md:self-auto justify-center"
              >
                <span>{discordAddon?.buttonStyle === "Labeled" ? "Join Discord" : "Open Discord"}</span>
                <ArrowRight size={16} />
              </a>
            </div>
          </div>
        )}

        {/* 01 MY SERVERS */}
        <section id="servers" className="py-6 border-t border-theme-600/20 bg-zinc-950/40">
            <div className="max-w-7xl mx-auto px-4 md:px-5">
                <div className="flex items-center gap-4 mb-6 reveal">
                    <span className="font-mono text-sm text-theme-500 bg-theme-600/10 px-2.5 py-1 rounded-md border border-theme-600/30 font-bold">01</span>
                    <h2 className="font-display font-bold tracking-tight text-2xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-100 to-theme-200 flex items-center gap-3">
                        <Box className="w-7 h-7 text-theme-500" /> MY SERVERS
                    </h2>
                </div>

                <div className="space-y-2">
                    {myServers.length > 0 ? (
                        myServers.map((s, i) => renderServerCard(s, i, false))
                    ) : (
                        <div className="py-8 text-center border border-dashed border-theme-600/30 rounded-2xl bg-zinc-900/30 backdrop-blur-sm reveal">
                            <Box className="w-12 h-12 text-theme-600/50 mx-auto mb-4" />
                            <p className="font-display text-xl text-white font-bold">No servers yet</p>
                            <p className="font-mono text-sm text-white mt-2">Create a server to get started.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>

        {/* 02 OTHER SERVERS (ADMIN ONLY) */}
        {(user?.role === 'admin' || user?.role === 'owner') && (
        <section id="other-servers" className="py-8 border-t border-theme-800/20 bg-zinc-950/60 mt-6">
            <div className="max-w-7xl mx-auto px-4 md:px-5">
                <div className="flex items-center justify-between mb-6 reveal">
                    <div className="flex items-center gap-4">
                        <span className="font-mono text-sm text-theme-700 bg-theme-800/10 px-2.5 py-1 rounded-md border border-theme-800/30 font-bold">02</span>
                        <h2 className="font-display font-bold tracking-tight text-2xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-theme-100 to-theme-300 flex items-center gap-3">
                            <Shield className="w-7 h-7 text-theme-700" /> OTHER SERVERS
                        </h2>
                    </div>
                    <span className="hidden md:flex font-mono text-[10px] text-theme-600 font-bold tracking-widest border border-theme-800/30 bg-theme-800/10 px-3 py-1.5 rounded-full uppercase">
                        ADMIN ONLY VIEW
                    </span>
                </div>

                <div className="space-y-2">
                    {operatorServers.length > 0 ? (
                        operatorServers.map((s, i) => renderServerCard(s, i, true))
                    ) : (
                        <div className="py-6 text-center border border-dashed border-theme-800/30 rounded-2xl bg-zinc-900/30 backdrop-blur-sm reveal">
                            <Shield className="w-10 h-10 text-theme-800/50 mx-auto mb-3" />
                            <p className="font-mono text-sm text-theme-600/80 tracking-widest uppercase">No external servers found</p>
                        </div>
                    )}
                </div>
            </div>
        </section>
        )}
      </div>
    </div>
  );
}
