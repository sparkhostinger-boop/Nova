const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

// Replace the Metric and ServerCard components
code = code.replace(
  /\/\* ── STEP 5 · Primitives ──────────────────────────────────────────────────── \*\/(.|\n)*\/\* ── STEP 7 · Sections ────────────────────────────────────────────────────── \*\//m,
  `/* ── STEP 5 · Primitives ──────────────────────────────────────────────────── */

import { Cpu, HardDrive, MemoryStick, Network, Server as ServerIcon } from "lucide-react";

/** Pterodactyl style metric */
function RowMetric({ icon: Icon, value, subtext, color }: { icon: any, value: ReactNode, subtext?: string, color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={\`h-4 w-4 \${color || 'text-muted-foreground'}\`} />
      <div className="flex flex-col">
        <span className={\`text-sm font-semibold \${color || 'text-foreground'}\`}>{value}</span>
        {subtext && <span className="text-[10px] text-muted-foreground font-medium">{subtext}</span>}
      </div>
    </div>
  );
}

/* ── STEP 6 · ServerCard ──────────────────────────────────────────────────── */
const ServerCard = memo(function ServerCard({ server }: { server: ServerRecord }) {
  const isSuspended = server.suspended;

  const content = (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
      {/* Left: Icon and Name */}
      <div className="flex items-center gap-4 min-w-[200px]">
        <div className={\`flex h-10 w-10 shrink-0 items-center justify-center rounded-full \${isOnline(server.status) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted-strong text-muted-foreground'}\`}>
          <ServerIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground hover:text-indigo-400 transition-colors">
            {server.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px]">
            {server.version ? \`\${server.type || 'Minecraft'} \${server.version}\` : 'Manage this instance'}
          </p>
        </div>
      </div>
      
      {/* Right: Metrics */}
      <div className="flex items-center gap-6 md:gap-8 overflow-x-auto custom-scrollbar pb-2 md:pb-0 hide-scrollbar">
        {isSuspended ? (
           <div className="inline-flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 uppercase">
             <Lock className="h-3 w-3" /> Suspended
           </div>
        ) : (
          <>
            <RowMetric 
              icon={Network} 
              value={<span className="font-mono text-muted-foreground">{server.ipAlias || \`127.0.0.1:\${server.port || '25565'}\`}</span>} 
            />
            <RowMetric 
              icon={Cpu} 
              value={<span className="font-mono text-muted-foreground">— %</span>} 
            />
            <RowMetric 
              icon={MemoryStick} 
              value={
                 <ServerLiveStats
                   serverId={server.id}
                   limitRam={server.ram}
                   status={server.status}
                   pterodactylMode={true}
                 />
              } 
              subtext={\`of \${server.ram} GB\`}
              color={isOnline(server.status) ? "text-emerald-400" : undefined}
            />
            <RowMetric 
              icon={HardDrive} 
              value={<span className="font-mono text-muted-foreground">— MB</span>} 
              subtext={\`of \${server.disk || DEFAULT_DISK} GB\`}
            />
          </>
        )}
      </div>
    </div>
  );

  return (
    <motion.article variants={itemVariants}>
      {isSuspended ? (
        <div className="group relative block overflow-hidden rounded-md border border-red-500/10 bg-black/40 p-4 opacity-75 cursor-not-allowed">
          {content}
        </div>
      ) : (
        <Link
          to={\`/servers/\${server.id}\`}
          className="group relative block overflow-hidden rounded-md border border-border-subtle bg-card/60 p-4 transition-colors duration-200 hover:border-border hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          {content}
        </Link>
      )}
    </motion.article>
  );
});

/* ── STEP 7 · Sections ────────────────────────────────────────────────────── */`
);

fs.writeFileSync('src/pages/ServerList.tsx', code);
