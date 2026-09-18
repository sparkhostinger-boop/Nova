// @ts-nocheck
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  ServerList · Fleet grid with live status and per-server metrics           ║
// ║                                                                            ║
// ║  STEP 1 · Imports          STEP 5 · Primitives (StatusBadge, Metric)       ║
// ║  STEP 2 · Types            STEP 6 · ServerCard                             ║
// ║  STEP 3 · Constants        STEP 7 · Sections (Loading, Empty)             ║
// ║  STEP 4 · Data hook        STEP 8 · Page composition                       ║
// ╚══════════════════════════════════════════════════════════════════════════╝

/* ── STEP 1 · Imports ─────────────────────────────────────────────────────── */
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Server, Plus, ChevronRight, Settings, Lock, User } from "lucide-react";
import { motion, type Variants } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import ServerLiveStats from "../components/ServerLiveStats";

/* ── STEP 2 · Types ───────────────────────────────────────────────────────── */
type ServerStatus = "online" | "offline" | (string & {});

interface ServerRecord {
  type?: string;
  software?: string;
  id: string;
  name: string;
  status: ServerStatus;
  cpu?: number;
  ram?: number;
  disk?: number;
  version?: string;
  suspended?: boolean;
}

interface ServersState {
  servers: ServerRecord[];
  error: string | null;
  isLoading: boolean;
}

/* ── STEP 3 · Constants ───────────────────────────────────────────────────── */
const EASE = [0.22, 1, 0.36, 1] as const;
const POLL_INTERVAL_MS = 5_000;
const DEFAULT_CPU = 100;
const DEFAULT_DISK = 10;
const SURFACE = "transparent"; // Changed to transparent so global background shows

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } },
};

const isOnline = (status?: ServerStatus): boolean => status === "online";

/* ── STEP 4 · Data hook (fetch + poll) ────────────────────────────────────── */
/** Fetches the server fleet and re-polls on a fixed interval with cleanup. */
function useServers(pollIntervalMs = POLL_INTERVAL_MS): ServersState {
  const [servers, setServers] = useState<ServerRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchServers = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await axios.get<ServerRecord[]>("/api/servers", { signal });
      setServers(Array.isArray(res.data) ? res.data : []);
      setError(null);
    } catch (err) {
      if (axios.isCancel(err)) return;
      setError("Unable to load servers. Retrying…");
      console.error("Failed to fetch servers:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void fetchServers(controller.signal);
    const interval = window.setInterval(
      () => void fetchServers(controller.signal),
      pollIntervalMs,
    );
    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [fetchServers, pollIntervalMs]);

  return { servers, error, isLoading };
}

/* ── STEP 5 · Primitives ──────────────────────────────────────────────────── */

import { Cpu, HardDrive, MemoryStick, Network, Server as ServerIcon } from "lucide-react";

/** Pterodactyl style metric */
function RowMetric({ icon: Icon, value, subtext, color }: { icon: any, value: ReactNode, subtext?: string, color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={`h-4 w-4 ${color || 'text-muted-foreground'}`} />
      <div className="flex flex-col">
        <span className={`text-sm font-semibold ${color || 'text-foreground'}`}>{value}</span>
        {subtext && <span className="text-[10px] text-muted-foreground font-medium">{subtext}</span>}
      
        <div className="mt-8 text-center text-xs text-muted-foreground/60 font-medium pb-8">
           &copy; 2015 - {new Date().getFullYear()} "Panel Software"
        </div>
      </div>
    </div>
  );
}


function StatusBadge({ status }: { status?: ServerStatus }) {
  const online = isOnline(status);
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase ring-1 ${
      online 
        ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' 
        : 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20'
    }`}>
      <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`} />
      {status || 'offline'}
    </span>
  );
}

/* ── STEP 6 · ServerCard ──────────────────────────────────────────────────── */
const ServerCard = memo(function ServerCard({ server }: { server: ServerRecord }) {
  const isSuspended = server.suspended;
  const checkStr = `${server.type || ''} ${server.software || ''} ${server.name || ''} ${server.version || ''}`.toLowerCase();
  const isPaper = checkStr.includes('paper');
  const isVelocity = checkStr.includes('velocity');

  const content = (
    <div className="flex items-center justify-between gap-4 w-full py-1">
      <div className="flex items-center gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${isOnline(server.status) ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-muted text-muted-foreground ring-1 ring-border'}`}>
          <ServerIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground group-hover:text-indigo-400 transition-colors">
            {server.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {server.version ? `${server.type || 'Minecraft'} ${server.version}` : 'Game server instance'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        {isSuspended ? (
           <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1 text-xs font-semibold text-red-400 uppercase ring-1 ring-red-500/30">
             <Lock className="h-3 w-3" /> Suspended
           </span>
        ) : (
          <StatusBadge status={server.status} />
        )}
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
      </div>
    </div>
  );

  return (
    <motion.article variants={itemVariants}>
      {isSuspended ? (
        <div className="group relative block overflow-hidden rounded-2xl border border-red-500/20 bg-black/40 p-5 opacity-75 cursor-not-allowed">
          {isPaper && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
              <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto" />
            </div>
          )}
          {isVelocity && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
              <img src="https://assets.papermc.io/brand/velocity_combination_mark_blue.min.svg" alt="Velocity" className="h-16 w-auto object-contain brightness-0 invert opacity-90" />
            </div>
          )}
          <div className="relative z-10">{content}</div>
        </div>
      ) : (
        <Link
          to={`/servers/${server.id}`}
          className="group relative block overflow-hidden rounded-2xl border border-border-subtle bg-card/70 backdrop-blur-md p-5 transition-all duration-200 hover:border-indigo-500/40 hover:bg-card hover:shadow-lg hover:shadow-indigo-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
        >
          {isPaper && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity z-0">
              <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto" />
            </div>
          )}
          {isVelocity && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity z-0">
              <img src="https://assets.papermc.io/brand/velocity_combination_mark_blue.min.svg" alt="Velocity" className="h-16 w-auto object-contain brightness-0 invert opacity-90" />
            </div>
          )}
          <div className="relative z-10">{content}</div>
        </Link>
      )}
    </motion.article>
  );
});

/* ── STEP 7 · Sections ────────────────────────────────────────────────────── */
function LoadingState() {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
      style={{ backgroundColor: SURFACE }}
    >
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-white/70"
        aria-hidden
      />
      <p className="text-sm font-medium text-muted-foreground">Loading servers…</p>
    </div>
  );
}

function EmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <motion.div
      variants={itemVariants}
      className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted-subtle px-6 py-12 text-center"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-muted">
        <Server className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">
        No servers running
      </h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        You haven&apos;t created any servers yet. Create one to start managing
        your game servers.
      </p>
    </motion.div>
  );
}

/* ── STEP 8 · Page composition ────────────────────────────────────────────── */
export default function ServerList() {
  const { user, openAccountModal } = useAuth();
  const { panelName, addons } = useSettings();
  const { servers, error, isLoading } = useServers();

  const discordAddon = addons?.discord;
  const isDiscordEnabled = Boolean(discordAddon?.enabled);
  const showDiscordDashboard = isDiscordEnabled && discordAddon?.position === "Dashboard";
  const discordUrl = (discordAddon?.inviteUrl && discordAddon.inviteUrl.trim().length > 0)
    ? discordAddon.inviteUrl.trim()
    : "https://discord.gg";

  // 8.1 · Gating — resolve auth BEFORE making any role decision.
  //        `user` is undefined while auth is still restoring; null when logged
  //        out; an object once resolved. Gating on this prevents admin controls
  //        from flickering in/out on first paint.
  //        If your AuthContext exposes an explicit flag instead (e.g. `loading`
  //        or `isReady`), swap the line below for: const isAuthReady = !loading;
  const isAuthReady = user !== undefined;
  const isAdmin = isAuthReady && user?.role === "admin";
  const hasServers = servers.length > 0;

  // 8.2 · Live "X of Y online" summary.
  const onlineCount = useMemo(
    () => servers.reduce((n, s) => n + (isOnline(s.status) ? 1 : 0), 0),
    [servers],
  );

  // 8.3 · First paint: wait for auth readiness AND the initial data load.
  if (!isAuthReady || (isLoading && !hasServers)) return <LoadingState />;

  // 8.4 · Full page.
  return (
    <div
      className="relative min-h-screen text-foreground"
      style={{ backgroundColor: SURFACE }}
    >
      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-5 md:py-8">
        {/* 8.4a · Header */}
        <header className="mb-4 flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
             <button
               id="serverlist-user-profile-btn"
               onClick={openAccountModal}
               className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-card/70 hover:bg-card border border-border-subtle hover:border-indigo-500/50 text-foreground transition-all text-xs font-medium shadow-sm cursor-pointer group"
               title="Account Settings (Click to change username, email or password)"
             >
               <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shadow-sm group-hover:scale-105 transition-transform">
                 {user?.username?.[0]?.toUpperCase() || <User size={12} />}
               </div>
               <span className="font-semibold">{user?.username}</span>
               <span className="text-[10px] text-muted-foreground group-hover:text-indigo-400 font-normal border-l border-border-subtle pl-2">Account</span>
             </button>
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-semibold text-muted-foreground uppercase tracking-wide">
             SHOWING YOUR SERVERS
             <div className="w-10 h-5 bg-indigo-500 rounded-full flex items-center p-0.5 shadow-inner">
               <div className="w-4 h-4 bg-white rounded-full translate-x-5 shadow-sm" />
             </div>
          </div>
        </header>

        {/* 8.4b · Error banner */}
        {error && (
          <div
            role="alert"
            className="mb-6 rounded-xl border border-red-500/20 bg-red-500/[0.08] px-4 py-3 text-sm font-medium text-red-300"
          >
            {error}
          </div>
        )}

        {/* Discord Community Banner (When position is set to Dashboard) */}
        {showDiscordDashboard && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-[#5865F2]/30 bg-gradient-to-r from-[#5865F2]/15 via-zinc-900/70 to-zinc-950/80 p-5 md:p-6 backdrop-blur-md shadow-lg shadow-[#5865F2]/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#5865F2] flex items-center justify-center text-white shadow-md shadow-[#5865F2]/40 shrink-0">
                <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Join Our Discord Community</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Stay updated, get fast assistance, and chat with fellow members.</p>
              </div>
            </div>
            <a 
              href={discordUrl} 
              target="_blank" 
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-[#5865F2] hover:bg-[#4752C4] text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-[#5865F2]/30 flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
            >
              <span>{discordAddon?.buttonStyle === "Labeled" ? "Join Discord" : "Open Discord"}</span>
              <ChevronRight size={16} />
            </a>
          </div>
        )}

        {/* 8.4c · Fleet */}
        <motion.section
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4"
          aria-label="Servers"
        >
          {hasServers ? (
            servers.map((server) => (
              <ServerCard key={server.id} server={server} />
            ))
          ) : (
            <EmptyState isAdmin={isAdmin} />
          )}
        </motion.section>
        <div className="mt-8 text-center text-xs text-muted-foreground/60 font-medium pb-8">
           &copy; 2015 - {new Date().getFullYear()} {panelName || "Panel"} Software
        </div>
      </div>
    </div>
  );
}
