const fs = require('fs');

// 1. Update src/pages/ServerList.tsx
let serverListCode = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

serverListCode = serverListCode.replace(
  'const isPaper = (server.type || server.software || "").toLowerCase().includes("paper") || server.name.toLowerCase().includes("paper");',
  `const isPaper = (server.type || server.software || "").toLowerCase().includes("paper") || server.name.toLowerCase().includes("paper");
  const isSpigot = (server.type || server.software || "").toLowerCase().includes("spigot") || server.name.toLowerCase().includes("spigot");`
);

// Replace isPaper watermark blocks with both isPaper and isSpigot
const paperWatermarkBlock = `{isPaper && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
              <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto" />
            </div>
          )}`;

const combinedWatermarkBlocks = `{isPaper && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
              <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto" />
            </div>
          )}
          {isSpigot && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
              <img src="https://proxy.spigotmc.org/a8fa5c49b64fdfc435cc3837163e21fbcc282084/687474703a2f2f692e696d6775722e636f6d2f4a6b594d4b58362e706e67" alt="Spigot" className="h-16 w-auto object-contain" />
            </div>
          )}`;

serverListCode = serverListCode.split(paperWatermarkBlock).join(combinedWatermarkBlocks);

fs.writeFileSync('src/pages/ServerList.tsx', serverListCode);
console.log("Updated ServerList.tsx with Spigot watermark");

// 2. Update src/components/dashboard/ServerCard.tsx
let dashCode = fs.readFileSync('src/components/dashboard/ServerCard.tsx', 'utf8');

dashCode = dashCode.replace(
  'const isPaper = (server.software || server.type || "").toLowerCase().includes("paper") || server.name.toLowerCase().includes("paper");',
  `const isPaper = (server.software || server.type || "").toLowerCase().includes("paper") || server.name.toLowerCase().includes("paper");
  const isSpigot = (server.software || server.type || "").toLowerCase().includes("spigot") || server.name.toLowerCase().includes("spigot");`
);

const dashPaperWatermark = `{isPaper && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
          <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto" />
        </div>
      )}`;

const dashCombinedWatermark = `{isPaper && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
          <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto" />
        </div>
      )}
      {isSpigot && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
          <img src="https://proxy.spigotmc.org/a8fa5c49b64fdfc435cc3837163e21fbcc282084/687474703a2f2f692e696d6775722e636f6d2f4a6b594d4b58362e706e67" alt="Spigot" className="h-16 w-auto object-contain" />
        </div>
      )}`;

dashCode = dashCode.split(dashPaperWatermark).join(dashCombinedWatermark);

fs.writeFileSync('src/components/dashboard/ServerCard.tsx', dashCode);
console.log("Updated dashboard ServerCard.tsx with Spigot watermark");

