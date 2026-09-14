import re

with open("src/components/ServerConsole.tsx", "r") as f:
    content = f.read()

# Replace Console box
console_old = r"""<div className="bg-\[\#131010\] rounded-\[10px\] overflow-hidden flex flex-col h-\[300px\] sm:h-\[350px\] xl:h-\[450px\] animate-\[rise_\.5s_ease_\.08s_both\]">
          <div className="flex-1 overflow-y-auto p-\[10px_14px\] bg-\[\#0d0c0c\] font-mono text-\[12\.5px\] leading-\[1\.62\] text-\[\#c9c9c9\]" ref=\{bodyRef\} onScroll=\{onScroll\}> 
             \{logs.map\(\(log, i\) => renderLog\(log, i\)\)\}
          </div>
          <form onSubmit=\{send\} className="flex items-center gap-\[11px\] p-\[10px_14px\] bg-\[\#191717\] border-t border-\[\#232020\]">
            <ChevronRight className="text-\[\#8a8a8a\] w-4 h-4 shrink-0" />
            <input 
              ref=\{inputRef\}
              value=\{command\}
              onChange=\{\(e\) => setCommand\(e\.target\.value\)\}
              type="text" 
              placeholder="Type a command..." 
              className="flex-1 bg-transparent border-0 outline-none text-\[\#e9eaee\] font-mono text-\[13px\] placeholder:text-\[\#5c5c5c\]" 
              autoComplete="off" 
            />
          </form>
        </div>"""

console_new = """<div className="bg-zinc-950/60 border border-zinc-800/60 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col h-[300px] sm:h-[350px] xl:h-[450px] animate-[rise_.5s_ease_.08s_both] shadow-xl">
          <div className="flex-1 overflow-y-auto p-4 bg-black/40 font-mono text-sm leading-relaxed text-zinc-300 custom-scrollbar" ref={bodyRef} onScroll={onScroll}> 
             {logs.map((log, i) => renderLog(log, i))}
          </div>
          <form onSubmit={send} className="flex items-center gap-3 p-3 bg-zinc-900/50 border-t border-zinc-800/50">
            <ChevronRight className="text-zinc-500 w-4 h-4 shrink-0" />
            <input 
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              type="text" 
              placeholder="Type a command..." 
              className="flex-1 bg-transparent border-0 outline-none text-zinc-100 font-mono text-sm placeholder:text-zinc-600" 
              autoComplete="off" 
            />
          </form>
        </div>"""

content = re.sub(console_old, console_new, content)

# Buttons
topbar_old = r"""<div className="flex items-center gap-2 sm:gap-\[14px\] w-full sm:w-auto justify-end">
          <button onClick=\{\(\) => executeAction\('start'\)\} className="flex-1 sm:flex-initial min-w-\[70px\] sm:min-w-\[104px\] h-\[40px\] sm:h-\[46px\] border-none rounded-full flex items-center justify-center text-\[16px\] sm:text-\[19px\] text-white cursor-pointer bg-\[\#4CAF50\] transition-all hover:brightness-\[1\.12\] hover:-translate-y-px active:translate-y-0 touch-manipulation" title="Start">
            <Play className="w-5 h-5 fill-current" />
          </button>
          <button onClick=\{\(\) => executeAction\('restart'\)\} className="flex-1 sm:flex-initial min-w-\[70px\] sm:min-w-\[104px\] h-\[40px\] sm:h-\[46px\] border-none rounded-full flex items-center justify-center text-\[16px\] sm:text-\[19px\] text-white cursor-pointer bg-\[\#e8bd15\] transition-all hover:brightness-\[1\.12\] hover:-translate-y-px active:translate-y-0 touch-manipulation" title="Restart">
            <RotateCw className="w-5 h-5" />
          </button>
          <button onClick=\{\(\) => executeAction\('stop'\)\} className="flex-1 sm:flex-initial min-w-\[70px\] sm:min-w-\[104px\] h-\[40px\] sm:h-\[46px\] border-none rounded-full flex items-center justify-center text-\[16px\] sm:text-\[19px\] text-white cursor-pointer bg-\[\#fb4242\] transition-all hover:brightness-\[1\.12\] hover:-translate-y-px active:translate-y-0 touch-manipulation" title="Stop">
            <Square className="w-5 h-5 fill-current" />
          </button>
        </div>"""

topbar_new = """<div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
          <button onClick={() => executeAction('start')} className="flex-1 sm:flex-initial min-w-[70px] sm:min-w-[104px] h-[40px] sm:h-[46px] border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-50 bg-emerald-500/10 hover:bg-emerald-500 hover:border-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0)] hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] touch-manipulation" title="Start">
            <Play className="w-5 h-5 fill-current" />
          </button>
          <button onClick={() => executeAction('restart')} className="flex-1 sm:flex-initial min-w-[70px] sm:min-w-[104px] h-[40px] sm:h-[46px] border border-amber-500/20 rounded-full flex items-center justify-center text-amber-50 bg-amber-500/10 hover:bg-amber-500 hover:border-amber-400 transition-all shadow-[0_0_15px_rgba(245,158,11,0)] hover:shadow-[0_0_15px_rgba(245,158,11,0.3)] touch-manipulation" title="Restart">
            <RotateCw className="w-5 h-5" />
          </button>
          <button onClick={() => executeAction('stop')} className="flex-1 sm:flex-initial min-w-[70px] sm:min-w-[104px] h-[40px] sm:h-[46px] border border-rose-500/20 rounded-full flex items-center justify-center text-rose-50 bg-rose-500/10 hover:bg-rose-500 hover:border-rose-400 transition-all shadow-[0_0_15px_rgba(244,63,94,0)] hover:shadow-[0_0_15px_rgba(244,63,94,0.3)] touch-manipulation" title="Stop">
            <Square className="w-5 h-5 fill-current" />
          </button>
        </div>"""

content = re.sub(topbar_old, topbar_new, content)

with open("src/components/ServerConsole.tsx", "w") as f:
    f.write(content)
