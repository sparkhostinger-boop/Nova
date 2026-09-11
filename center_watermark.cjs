const fs = require('fs');

// 1. Update ServerList.tsx
let serverListCode = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

serverListCode = serverListCode.replace(
  /<div className="absolute right-6 top-1\/2 -translate-y-1\/2 flex items-center pointer-events-none opacity-20 z-0">[\s\S]*?<\/div>/g,
  `<div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15 z-0">
            <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-16 w-auto" />
          </div>`
);

fs.writeFileSync('src/pages/ServerList.tsx', serverListCode);
console.log("Updated ServerList.tsx");

// 2. Update dashboard ServerCard.tsx
let dashCode = fs.readFileSync('src/components/dashboard/ServerCard.tsx', 'utf8');

dashCode = dashCode.replace(
  /<div className="absolute right-8 top-0 bottom-0 my-auto flex items-center pointer-events-none opacity-10 group-hover:opacity-25 transition-opacity z-0">[\s\S]*?<\/div>/g,
  `<div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-15 z-0">
        <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-16 w-auto" />
      </div>`
);

fs.writeFileSync('src/components/dashboard/ServerCard.tsx', dashCode);
console.log("Updated dashboard ServerCard.tsx");

