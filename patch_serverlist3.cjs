const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

code = code.replace(
  /<\/div>\n    <\/div>\n  \);\n}/,
  `
        <div className="mt-8 text-center text-xs text-muted-foreground/60 font-medium pb-8">
           &copy; 2015 - {new Date().getFullYear()} {panelName || "Panel"} Software
        </div>
      </div>
    </div>
  );
}`
);

// We need to import useSettings to use panelName
code = code.replace(
  'import { useAuth } from "../context/AuthContext";',
  'import { useAuth } from "../context/AuthContext";\nimport { useSettings } from "../context/SettingsContext";'
);

code = code.replace(
  'const { user } = useAuth();',
  'const { user } = useAuth();\n  const { panelName } = useSettings();'
);

fs.writeFileSync('src/pages/ServerList.tsx', code);
