const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

code = code.replace(
  /<header className="mb-8 flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-center sm:justify-between">(.|\n)*?<\/header>/m,
  `<header className="mb-4 flex flex-col gap-4 pb-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
             <div className="hidden sm:flex" />
          </div>
          
          <div className="flex items-center gap-3 self-end sm:self-auto text-xs font-semibold text-muted-foreground uppercase tracking-wide">
             SHOWING YOUR SERVERS
             <div className="w-10 h-5 bg-indigo-500 rounded-full flex items-center p-0.5 shadow-inner">
               <div className="w-4 h-4 bg-white rounded-full translate-x-5 shadow-sm" />
             </div>
          </div>
        </header>`
);

fs.writeFileSync('src/pages/ServerList.tsx', code);
