const fs = require('fs');

// 1. Update src/pages/ServerList.tsx
let serverListCode = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

// Replace isSpigot with isVelocity and update URL
serverListCode = serverListCode.replace(
  'const isSpigot = (server.type || server.software || "").toLowerCase().includes("spigot") || server.name.toLowerCase().includes("spigot");',
  'const isVelocity = (server.type || server.software || "").toLowerCase().includes("velocity") || server.name.toLowerCase().includes("velocity");'
);

// Remove Spigot watermark block and add Velocity watermark block
const spigotBlock = `{isSpigot && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
              <img src="https://proxy.spigotmc.org/a8fa5c49b64fdfc435cc3837163e21fbcc282084/687474703a2f2f692e696d6775722e636f6d2f4a6b594d4b58362e706e67" alt="Spigot" className="h-16 w-auto object-contain" />
            </div>
          )}`;

const velocityBlock = `{isVelocity && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
              <img src="https://assets.papermc.io/brand/velocity_combination_mark_blue.min.svg" alt="Velocity" className="h-16 w-auto object-contain" />
            </div>
          )}`;

serverListCode = serverListCode.split(spigotBlock).join(velocityBlock);
fs.writeFileSync('src/pages/ServerList.tsx', serverListCode);
console.log("Updated ServerList.tsx with Velocity");

// 2. Update src/components/dashboard/ServerCard.tsx
let dashCode = fs.readFileSync('src/components/dashboard/ServerCard.tsx', 'utf8');

dashCode = dashCode.replace(
  'const isSpigot = (server.software || server.type || "").toLowerCase().includes("spigot") || server.name.toLowerCase().includes("spigot");',
  'const isVelocity = (server.software || server.type || "").toLowerCase().includes("velocity") || server.name.toLowerCase().includes("velocity");'
);

const dashSpigotBlock = `{isSpigot && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
          <img src="https://proxy.spigotmc.org/a8fa5c49b64fdfc435cc3837163e21fbcc282084/687474703a2f2f692e696d6775722e636f6d2f4a6b594d4b58362e706e67" alt="Spigot" className="h-16 w-auto object-contain" />
        </div>
      )}`;

const dashVelocityBlock = `{isVelocity && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
          <img src="https://assets.papermc.io/brand/velocity_combination_mark_blue.min.svg" alt="Velocity" className="h-16 w-auto object-contain" />
        </div>
      )}`;

dashCode = dashCode.split(dashSpigotBlock).join(dashVelocityBlock);
fs.writeFileSync('src/components/dashboard/ServerCard.tsx', dashCode);
console.log("Updated dashboard ServerCard.tsx with Velocity");

