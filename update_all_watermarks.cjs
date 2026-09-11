const fs = require('fs');

// 1. Dashboard.tsx
let dash = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');
dash = dash.replace(
  '  const renderServerCard = (s: any, index: number, isAdminView: boolean = false) => {',
  `  const renderServerCard = (s: any, index: number, isAdminView: boolean = false) => {
    const checkStr = \`\${s.type || ''} \${s.software || ''} \${s.name || ''} \${s.version || ''}\`.toLowerCase();
    const isPaper = checkStr.includes('paper');
    const isVelocity = checkStr.includes('velocity');`
);

dash = dash.replace(
  `className={\`reveal group flex flex-col md:grid md:grid-cols-12`,
  `className={\`reveal group relative overflow-hidden flex flex-col md:grid md:grid-cols-12`
);

// Inject watermarks inside article before Rank/Index
dash = dash.replace(
  `style={{transitionDelay: \`\${(index % 10) * 50}ms\`}}
      >`,
  `style={{transitionDelay: \`\${(index % 10) * 50}ms\`}}
      >
        {isPaper && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 z-0">
            <img src="https://papermc.io/_astro/logo-marker-light.vZ8PqE_1.svg" alt="Paper" className="h-20 w-auto object-contain" />
          </div>
        )}
        {isVelocity && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25 z-0">
            <img src="https://assets.papermc.io/brand/velocity_combination_mark_blue.min.svg" alt="Velocity" className="h-16 w-auto object-contain brightness-0 invert opacity-95" />
          </div>
        )}`
);

// Wrap inner grid children in relative z-10 div
dash = dash.replace(
  `{/* Rank / Index */}\n        <div className="hidden`,
  `<div className="relative z-10 contents">\n        {/* Rank / Index */}\n        <div className="hidden`
);

// Close the wrapper before </article>
dash = dash.replace(
  `        <div className="w-full md:col-span-2 lg:col-span-2 flex items-center justify-end mt-4 md:mt-0">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-theme-500/10 group-hover:border-theme-500/30 transition-all duration-300">
                <ArrowRight className="w-5 h-5 text-white group-hover:text-theme-400 group-hover:translate-x-1 transition-all duration-300" />
            </div>
        </div>
      </article>`,
  `        <div className="w-full md:col-span-2 lg:col-span-2 flex items-center justify-end mt-4 md:mt-0">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:bg-theme-500/10 group-hover:border-theme-500/30 transition-all duration-300">
                <ArrowRight className="w-5 h-5 text-white group-hover:text-theme-400 group-hover:translate-x-1 transition-all duration-300" />
            </div>
        </div>
        </div>
      </article>`
);

fs.writeFileSync('src/pages/Dashboard.tsx', dash);
console.log("Updated Dashboard.tsx");

// 2. ServerList.tsx
let serverList = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');
serverList = serverList.replace(
  /const isPaper =[\s\S]*?;/g,
  `const checkStr = \`\${server.type || ''} \${server.software || ''} \${server.name || ''} \${server.version || ''}\`.toLowerCase();
  const isPaper = checkStr.includes('paper');
  const isVelocity = checkStr.includes('velocity');`
);
fs.writeFileSync('src/pages/ServerList.tsx', serverList);
console.log("Updated ServerList.tsx");

// 3. ServerCard.tsx
let serverCard = fs.readFileSync('src/components/dashboard/ServerCard.tsx', 'utf8');
serverCard = serverCard.replace(
  /const isPaper =[\s\S]*?;/g,
  `const checkStr = \`\${server.type || ''} \${server.software || ''} \${server.name || ''} \${server.version || ''}\`.toLowerCase();
  const isPaper = checkStr.includes('paper');
  const isVelocity = checkStr.includes('velocity');`
);
fs.writeFileSync('src/components/dashboard/ServerCard.tsx', serverCard);
console.log("Updated ServerCard.tsx");

