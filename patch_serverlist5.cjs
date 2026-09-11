const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

const target = "        </motion.section>\n      </div>\n    </div>\n  );\n}";

const replacement = "        </motion.section>\n        <div className=\"mt-8 text-center text-xs text-muted-foreground/60 font-medium pb-8\">\n           &copy; 2015 - {new Date().getFullYear()} {panelName || \"Panel\"} Software\n        </div>\n      </div>\n    </div>\n  );\n}";

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/ServerList.tsx', code);
