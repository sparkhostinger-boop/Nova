const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

code = code.replace(
  `    </motion.article>\n  );\n/* ── STEP 7`,
  `    </motion.article>\n  );\n});\n\n/* ── STEP 7`
);

fs.writeFileSync('src/pages/ServerList.tsx', code);
console.log("Fixed ServerList closing");
