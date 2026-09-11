const fs = require('fs');

let dash = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const oldCardStart = `  const renderServerCard = (s: any, index: number, isAdminView: boolean = false) => {
    const isOnline = s.status === 'online' || s.status === 'ONLINE' || s.status === 'running';
    const typeLabel = s.type || s.software || 'Unknown';

    return (
      <article 
        key={s.id} 
        onClick={() => navigate(\`/servers/\${s.id}\`)}
        className={\`reveal group flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-4 rounded-2xl p-5 cursor-pointer transition-all duration-300 border bg-zinc-950/40 backdrop-blur-md \${`;

const newCardStart = `  const renderServerCard = (s: any, index: number, isAdminView: boolean = false) => {
    const isOnline = s.status === 'online' || s.status === 'ONLINE' || s.status === 'running';
    const typeLabel = s.type || s.software || 'Unknown';
    const checkStr = \`\${s.type || ''} \${s.software || ''} \${s.name || ''} \${s.version || ''}\`.toLowerCase();
    const isPaper = checkStr.includes('paper');
    const isVelocity = checkStr.includes('velocity');

    return (
      <article 
        key={s.id} 
        onClick={() => navigate(\`/servers/\${s.id}\`)}
        className={\`reveal group relative overflow-hidden flex flex-col md:grid md:grid-cols-12 items-start md:items-center gap-4 rounded-2xl p-5 cursor-pointer transition-all duration-300 border bg-zinc-950/40 backdrop-blur-md \${`;

dash = dash.replace(oldCardStart, newCardStart);

// Now inject watermarks right after <article ...>
const articleTagEnd = `style={{transitionDelay: \`\${(index % 10) * 50}ms\`}}
      >`;

const watermarksHtml = `style={{transitionDelay: \`\${(index % 10) * 50}ms\`}}
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
        )}
        <div className="relative z-10 contents">`;

// Wait, since article has grid in md, using contents or wrapping inner children in relative z-10:
// Actually, article has md:grid md:grid-cols-12. If we wrap the children inside article in a div with contents or relative z-10:
// Let's replace the return body of <article> ... </article>
