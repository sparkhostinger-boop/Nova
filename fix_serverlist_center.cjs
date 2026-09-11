const fs = require('fs');

let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

// Let's inspect how ServerCard return is structured in ServerList.tsx
// We can replace the return statement of ServerCard cleanly.
const newServerCardReturn = `  return (
    <motion.article variants={itemVariants}>
      {isSuspended ? (
        <div className="group relative block overflow-hidden rounded-2xl border border-red-500/20 bg-black/40 p-5 opacity-75 cursor-not-allowed">
          {isPaper && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 z-0">
              <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto" />
            </div>
          )}
          <div className="relative z-10">{content}</div>
        </div>
      ) : (
        <Link
          to={\`/servers/\${server.id}\`}
          className="group relative block overflow-hidden rounded-2xl border border-border-subtle bg-card/70 backdrop-blur-md p-5 transition-all duration-200 hover:border-indigo-500/40 hover:bg-card hover:shadow-lg hover:shadow-indigo-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
        >
          {isPaper && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity z-0">
              <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto" />
            </div>
          )}
          <div className="relative z-10">{content}</div>
        </Link>
      )}
    </motion.article>
  );`;

// Find where return ( starts in ServerCard
const startIndex = code.indexOf("const ServerCard = memo(function ServerCard");
const returnIndex = code.indexOf("  return (\n    <motion.article", startIndex);
const endIndex = code.indexOf("});", returnIndex);

if (startIndex !== -1 && returnIndex !== -1 && endIndex !== -1) {
  // Find the closing of ServerCard function
  // Let's replace from returnIndex to endIndex + 3
  code = code.substring(0, returnIndex) + newServerCardReturn + code.substring(endIndex + 3);
  fs.writeFileSync('src/pages/ServerList.tsx', code);
  console.log("ServerList.tsx ServerCard return updated successfully");
} else {
  console.log("Could not find ServerCard return indices in ServerList.tsx");
}
