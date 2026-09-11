const fs = require('fs');

// 1. Update src/pages/ServerList.tsx
let serverListCode = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

// Replace watermark block in ServerList.tsx for both suspended and Link
serverListCode = serverListCode.replace(
  /<div className="absolute[^>]*>[\s\S]*?<img[^>]*logo-marker-light[^>]*>[\s\S]*?<\/div>/g,
  ''
);

// We want to add the watermark right after Link / div start and wrap content in relative z-10
// Let's do a precise replacement or rewrite for ServerCard in ServerList.tsx
console.log("Updating ServerList.tsx...");

// 2. Update src/components/dashboard/ServerCard.tsx
let dashCode = fs.readFileSync('src/components/dashboard/ServerCard.tsx', 'utf8');

const dashTarget = `    <Link
      to={\`/servers/\${server.id}\`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer"
    >
      <div>`;

const dashReplacement = `    <Link
      to={\`/servers/\${server.id}\`}
      className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-5 shadow-lg backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:shadow-2xl hover:shadow-indigo-500/10 cursor-pointer"
    >
      {isPaper && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
          <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto" />
        </div>
      )}
      <div className="relative z-10">
        <div>`;

if (dashCode.includes(dashTarget)) {
  dashCode = dashCode.replace(dashTarget, dashReplacement);
  fs.writeFileSync('src/components/dashboard/ServerCard.tsx', dashCode);
  console.log("Updated dashboard ServerCard.tsx successfully");
} else {
  console.log("Could not find dashTarget in dashboard ServerCard.tsx");
}

