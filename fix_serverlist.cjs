const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

// Remove the erroneous footer snippet from RowMetric
code = code.replace(
  `        {subtext && <span className="text-[10px] text-muted-foreground font-medium">{subtext}</span>}              <div className="mt-8 text-center text-xs text-muted-foreground/60 font-medium pb-8">           &copy; 2015 - {new Date().getFullYear()} {panelName || "Panel"} Software        </div>`,
  `        {subtext && <span className="text-[10px] text-muted-foreground font-medium">{subtext}</span>}`
);

fs.writeFileSync('src/pages/ServerList.tsx', code);
console.log("Fixed successfully");
