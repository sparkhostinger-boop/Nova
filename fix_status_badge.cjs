const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

const statusBadgeDef = `
function StatusBadge({ status }: { status?: ServerStatus }) {
  const online = isOnline(status);
  return (
    <span className={\`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold uppercase ring-1 \${
      online 
        ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20' 
        : 'bg-zinc-500/10 text-zinc-400 ring-zinc-500/20'
    }\`}>
      <span className={\`h-1.5 w-1.5 rounded-full \${online ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}\`} />
      {status || 'offline'}
    </span>
  );
}
`;

// Insert before ServerCard
code = code.replace("/* ── STEP 6 · ServerCard ──────────────────────────────────────────────────── */", statusBadgeDef + "\n/* ── STEP 6 · ServerCard ──────────────────────────────────────────────────── */");

fs.writeFileSync('src/pages/ServerList.tsx', code);
console.log("Added StatusBadge definition");
