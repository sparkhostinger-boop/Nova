const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

code = code.replace(
  '  );/* ── STEP 7',
  '  );\n});\n\n/* ── STEP 7'
);

fs.writeFileSync('src/pages/ServerList.tsx', code);
console.log("Fixed ServerList ServerCard closing");
