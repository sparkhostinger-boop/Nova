const fs = require('fs');

// 1. Update ServerList.tsx
let serverListCode = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

if (!serverListCode.includes('type?: string;')) {
  serverListCode = serverListCode.replace(
    'interface ServerRecord {',
    'interface ServerRecord {\n  type?: string;\n  software?: string;'
  );
}

const oldServerCardContent = `const ServerCard = memo(function ServerCard({ server }: { server: ServerRecord }) {
  const isSuspended = server.suspended;

  const content = (`;

const newServerCardContent = `const ServerCard = memo(function ServerCard({ server }: { server: ServerRecord }) {
  const isSuspended = server.suspended;
  const isPaper = (server.type || server.software || "").toLowerCase().includes("paper") || server.name.toLowerCase().includes("paper");

  const content = (`;

serverListCode = serverListCode.replace(oldServerCardContent, newServerCardContent);

serverListCode = serverListCode.replace(
  '  return (\n    <motion.article variants={itemVariants}>',
  `  return (
    <motion.article variants={itemVariants}>
      {isPaper && (
        <div className="absolute right-8 top-0 bottom-0 my-auto flex items-center pointer-events-none opacity-10 group-hover:opacity-25 transition-opacity z-0">
          <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto" />
        </div>
      )}`
);

fs.writeFileSync('src/pages/ServerList.tsx', serverListCode);
console.log("Updated ServerList.tsx");

// 2. Update src/components/dashboard/ServerCard.tsx
let dashboardCardCode = fs.readFileSync('src/components/dashboard/ServerCard.tsx', 'utf8');

if (!dashboardCardCode.includes('logo-marker-light')) {
  dashboardCardCode = dashboardCardCode.replace(
    'export function ServerCard({ server }: ServerCardProps) {',
    `export function ServerCard({ server }: ServerCardProps) {
  const isPaper = (server.software || server.type || "").toLowerCase().includes("paper") || server.name.toLowerCase().includes("paper");`
  );

  dashboardCardCode = dashboardCardCode.replace(
    'export function ServerCard({ server }: ServerCardProps) {\n  const isPaper = (server.software || server.type || "").toLowerCase().includes("paper") || server.name.toLowerCase().includes("paper");\n\n  return (\n    <Link',
    `export function ServerCard({ server }: ServerCardProps) {
  const isPaper = (server.software || server.type || "").toLowerCase().includes("paper") || server.name.toLowerCase().includes("paper");

  return (
    <Link`
  );

  dashboardCardCode = dashboardCardCode.replace(
    '    <Link\n      to={`/servers/${server.id}`}\n      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer"\n    >\n      <div>',
    `    <Link
      to={\`/servers/\${server.id}\`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer"
    >
      {isPaper && (
        <div className="absolute right-8 top-0 bottom-0 my-auto flex items-center pointer-events-none opacity-10 group-hover:opacity-25 transition-opacity z-0">
          <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto" />
        </div>
      )}
      <div className="relative z-10">
        <div>`
  );

  dashboardCardCode = dashboardCardCode.replace(
    /    <\/Link>\n  \);\n}/,
    '      </div>\n    </Link>\n  );\n}'
  );

  fs.writeFileSync('src/components/dashboard/ServerCard.tsx', dashboardCardCode);
  console.log("Updated src/components/dashboard/ServerCard.tsx");
}
