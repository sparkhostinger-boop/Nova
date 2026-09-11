const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

if (!code.includes('/* ── STEP 7 · Sections */') && code.includes('/* ── STEP 7 · Sections ────────────────────────────────────────────────────── */')) {
  // Already has it, but ServerCard is missing });
}

// Let's find where ServerCard ends (after </motion.article>) and before /* ── STEP 7
const target = `    </motion.article>\n  );\n/* ── STEP 7`;
const replacement = `    </motion.article>\n  );\n});\n\n/* ── STEP 7`;

if (code.includes(target)) {
  code = code.replace(target, replacement);
  fs.writeFileSync('src/pages/ServerList.tsx', code);
  console.log("Added missing }); to ServerCard");
} else {
  console.log("Target not found");
}
