const fs = require('fs');
let serverList = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

serverList = serverList.replace(
  `    const isPaper = checkStr.includes('paper');
    const isVelocity = checkStr.includes('velocity');
    const isVelocity = (server.type || server.software || "").toLowerCase().includes("velocity") || server.name.toLowerCase().includes("velocity");`,
  `    const checkStr = \`\${server.type || ''} \${server.software || ''} \${server.name || ''} \${server.version || ''}\`.toLowerCase();
    const isPaper = checkStr.includes('paper');
    const isVelocity = checkStr.includes('velocity');`
);

fs.writeFileSync('src/pages/ServerList.tsx', serverList);
console.log("Fixed ServerList duplicate");
