const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

const newServerCard = `/* ── STEP 6 · ServerCard ──────────────────────────────────────────────────── */
const ServerCard = memo(function ServerCard({ server }: { server: ServerRecord }) {
  const isSuspended = server.suspended;

  const content = (
    <div className="flex items-center justify-between gap-4 w-full py-1">
      <div className="flex items-center gap-4">
        <div className={\`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl \${isOnline(server.status) ? 'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20' : 'bg-muted text-muted-foreground ring-1 ring-border'}\`}>
          <ServerIcon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground group-hover:text-indigo-400 transition-colors">
            {server.name}
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {server.version ? \`\${server.type || 'Minecraft'} \${server.version}\` : 'Game server instance'}
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
          {content}
        </div>
      ) : (
        <Link
          to={\`/servers/\${server.id}\`}
          className="group relative block overflow-hidden rounded-2xl border border-border-subtle bg-card/70 backdrop-blur-md p-5 transition-all duration-200 hover:border-indigo-500/40 hover:bg-card hover:shadow-lg hover:shadow-indigo-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
        >
          {content}
        </Link>
      )}
    </motion.article>
  );
});`;

// Find where ServerCard starts and replace until Sections
const startIndex = code.indexOf("/* ── STEP 6 · ServerCard ──────────────────────────────────────────────────── */");
const endIndex = code.indexOf("/* ── STEP 7 · Sections ────────────────────────────────────────────────────── */");

if (startIndex !== -1 && endIndex !== -1) {
  code = code.substring(0, startIndex) + newServerCard + "\n\n" + code.substring(endIndex);
}

fs.writeFileSync('src/pages/ServerList.tsx', code);
console.log("ServerList updated successfully");
