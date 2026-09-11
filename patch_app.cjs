const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /<Route path="\/" element={<ProtectedRoute><Dashboard \/><\/ProtectedRoute>} \/>/g,
  '<Route path="/" element={<ProtectedRoute><ServerList /></ProtectedRoute>} />'
);
code = code.replace(
  /<Route path="\/servers" element={<ProtectedRoute><ServerList \/><\/ProtectedRoute>} \/>/g,
  '<Route path="/admin" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />'
);
fs.writeFileSync('src/App.tsx', code);
