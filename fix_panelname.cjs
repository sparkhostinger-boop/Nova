const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

// Replace panelName in the footer with a static string or safely check it
// Or better yet, ensure panelName is used via useSettings or just default to "Panel"
code = code.replace(
  '{panelName || "Panel"} Software',
  '"Panel Software"'
);

fs.writeFileSync('src/pages/ServerList.tsx', code);
console.log("Fixed footer panelName reference");
