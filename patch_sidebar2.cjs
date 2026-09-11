const fs = require('fs');
let code = fs.readFileSync('src/components/Sidebar.tsx', 'utf8');

code = code.replace(
  '{ name: "Overview", path: "/", icon: <LayoutDashboard size={18} /> },',
  '{ name: "My Servers", path: "/", icon: <Server size={18} /> },\\n    { name: "Overview", path: "/admin", icon: <LayoutDashboard size={18} /> },'
);
code = code.replace(
  '    { name: "Servers", path: "/servers", icon: <Server size={18} /> },',
  ''
);

fs.writeFileSync('src/components/Sidebar.tsx', code);
