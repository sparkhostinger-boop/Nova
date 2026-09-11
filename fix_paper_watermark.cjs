const fs = require('fs');

let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

// Update ServerCard to place the watermark inside the card link/div with relative positioning
const oldServerCardReturn = `  return (
    <motion.article variants={itemVariants}>
      {isPaper && (
        <div className="absolute right-8 top-0 bottom-0 my-auto flex items-center pointer-events-none opacity-10 group-hover:opacity-25 transition-opacity z-0">
          <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto" />
        </div>
      )}
      {isSuspended ? (
        <div className="group relative block overflow-hidden rounded-2xl border border-red-500/20 bg-black/40 p-5 opacity-75 cursor-not-allowed">
          {content}
        </div>
      ) : (
        <Link
          to={\`/servers/\${server.id}\`}
          className="group relative block overflow-hidden rounded-2xl border border-border-subtle bg-card/70 backdrop-blur-md p-5 transition-all duration-200 hover:border-indigo-500/40 hover:bg-card hover:shadow-lg hover:shadow-indigo-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50"
        >
          {content}
        </Link>
      )}
    </motion.article>
  );`;

const newServerCardReturn = `  return (
    <motion.article variants={itemVariants}>
      {isSuspended ? (
        <div className="group relative block overflow-hidden rounded-2xl border border-red-500/20 bg-black/40 p-5 opacity-75 cursor-not-allowed">
          {isPaper && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none opacity-20 z-0">
              <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-16 w-auto" />
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
            <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity z-0">
              <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-16 w-auto" />
            </div>
          )}
          <div className="relative z-10">{content}</div>
        </Link>
      )}
    </motion.article>
  );`;

if (code.includes('absolute right-8 top-0 bottom-0')) {
  code = code.replace(oldServerCardReturn, newServerCardReturn);
  fs.writeFileSync('src/pages/ServerList.tsx', code);
  console.log("Fixed ServerList.tsx watermark positioning");
} else {
  console.log("Could not find exact oldServerCardReturn in ServerList.tsx");
}
