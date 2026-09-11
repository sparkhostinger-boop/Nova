const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

if (!code.includes("import ClientLayout")) {
    code = code.replace(
      'import NotificationsDropdown from "./NotificationsDropdown";',
      'import NotificationsDropdown from "./NotificationsDropdown";\nimport ClientLayout from "./ClientLayout";'
    );
}

if (!code.includes("isClientServerList")) {
    code = code.replace(
      'const isServerView = matchPath("/servers/:id/*", location.pathname) && !matchPath("/servers/create", location.pathname);',
      'const isServerView = matchPath("/servers/:id/*", location.pathname) && !matchPath("/servers/create", location.pathname);\n  const isClientServerList = location.pathname === "/";'
    );

    code = code.replace(
      'if (isServerView) {',
      'if (isClientServerList) {\n    return <ClientLayout>{children}</ClientLayout>;\n  }\n  if (isServerView) {'
    );
}

fs.writeFileSync('src/components/Layout.tsx', code);
