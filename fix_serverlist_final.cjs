const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

const target = `    </motion.article>\n  );\n/* ── STEP 7 · Sections`;
const replacement = `    </motion.article>\n  );\n});\n\n/* ── STEP 7 · Sections`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/ServerList.tsx', code);
  console.log("Successfully added }); to ServerCard");
} else {
  console.log("Target not found exactly");
}
