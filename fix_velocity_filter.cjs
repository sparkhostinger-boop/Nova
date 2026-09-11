const fs = require('fs');

// 1. Update src/pages/ServerList.tsx
let serverListCode = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');
serverListCode = serverListCode.replace(
  'alt="Velocity" className="h-16 w-auto object-contain"',
  'alt="Velocity" className="h-16 w-auto object-contain brightness-0 invert opacity-90"'
);
fs.writeFileSync('src/pages/ServerList.tsx', serverListCode);

// 2. Update src/components/dashboard/ServerCard.tsx
let dashCode = fs.readFileSync('src/components/dashboard/ServerCard.tsx', 'utf8');
dashCode = dashCode.replace(
  'alt="Velocity" className="h-16 w-auto object-contain"',
  'alt="Velocity" className="h-16 w-auto object-contain brightness-0 invert opacity-90"'
);
fs.writeFileSync('src/components/dashboard/ServerCard.tsx', dashCode);

console.log("Updated Velocity image filters");
