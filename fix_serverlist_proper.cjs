const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

let step6 = code.indexOf("STEP 6");
let target = "</motion.article>\n  );\n\n/* ── STEP 7";
let idx = code.indexOf(target, step6);

if (idx !== -1) {
  code = code.substring(0, idx) + "</motion.article>\n  );\n});\n\n/* ── STEP 7" + code.substring(idx + target.length);
  fs.writeFileSync('src/pages/ServerList.tsx', code);
  console.log("Successfully fixed ServerList.tsx closing bracket");
} else {
  console.log("Target not found");
}
