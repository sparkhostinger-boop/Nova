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
import { Server, Plus, ChevronRight, Settings, Lock } from "lucide-react";
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
  const { user } = useAuth();
  const { panelName } = useSettings();
  const { servers, error, isLoading } = useServers();

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
          <div className="flex items-center gap-2">
             <div className="hidden sm:flex" />
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
