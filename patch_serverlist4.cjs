const fs = require('fs');
let code = fs.readFileSync('src/pages/ServerList.tsx', 'utf8');

const target = \`        </motion.section>
      </div>
    </div>
  );
}\`;

const replacement = \`        </motion.section>
        
        <div className="mt-8 text-center text-xs text-muted-foreground/60 font-medium pb-8">
           &copy; 2015 - {new Date().getFullYear()} {panelName || "Panel"} Software
        </div>
      </div>
    </div>
  );
}\`;

code = code.replace(target, replacement);

fs.writeFileSync('src/pages/ServerList.tsx', code);
