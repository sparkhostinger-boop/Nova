with open("src/components/ServerConsole.tsx", "r") as f:
    content = f.read()

# ChartCard
content = content.replace("""    <div className="bg-[#131010] rounded-[10px] p-[12px_16px]">
      <div className="flex justify-between items-center mb-[12px]">
        <div className="text-[15px] font-[700] text-white">{title}</div>
        {icons && <div className="flex gap-[9px] items-center">{icons}</div>}
      </div>
      <div className="relative h-[140px]">""", """    <div className="bg-zinc-950/40 border border-zinc-800/50 backdrop-blur-md rounded-2xl p-5 shadow-sm hover:border-zinc-700/50 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-mono tracking-wider uppercase text-zinc-300 font-bold">{title}</div>
        {icons && <div className="flex gap-2 items-center">{icons}</div>}
      </div>
      <div className="relative h-[150px]">""")

# Console box
content = content.replace("""        <div className="bg-[#131010] rounded-[10px] overflow-hidden flex flex-col h-[300px] sm:h-[350px] xl:h-[450px] animate-[rise_.5s_ease_.08s_both]">
          <div className="flex-1 overflow-y-auto p-[10px_14px] bg-[#0d0c0c] font-mono text-[12.5px] leading-[1.62] text-[#c9c9c9]" ref={bodyRef} onScroll={onScroll}> 
             {logs.map((log, i) => renderLog(log, i))}
          </div>
          <form onSubmit={send} className="flex items-center gap-[11px] p-[10px_14px] bg-[#191717] border-t border-[#232020]">
            <ChevronRight className="text-[#8a8a8a] w-4 h-4 shrink-0" />
            <input 
              ref={inputRef}
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              type="text" 
              placeholder="Type a command..." 
              className="flex-1 bg-transparent border-0 outline-none text-[#e9eaee] font-mono text-[13px] placeholder:text-[#5c5c5c]" 
              autoComplete="off" 
            />
          </form>
        </div>""", """        <div className="bg-zinc-950/60 border border-zinc-800/60 backdrop-blur-md rounded-2xl overflow-hidden flex flex-col h-[300px] sm:h-[350px] xl:h-[450px] animate-[rise_.5s_ease_.08s_both] shadow-xl">
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
        </div>""")

# Status Orb and Title
content = content.replace("""        <div className="flex items-center gap-[12px] min-w-0">
          <div className={`w-[11px] h-[11px] rounded-full shrink-0 ${isOnline ? 'bg-[#42e33d] shadow-[0_0_10px_rgba(66,227,61,.55)] animate-[pulseOrb_2s_ease-in-out_infinite]' : stats.status === 'offline' ? 'bg-[#524b4b]' : 'bg-[#e8bd15] animate-[pulseOrb_1s_ease-in-out_infinite]'}`} />
          <h1 className="text-[20px] sm:text-[24px] font-[800] text-white truncate">{server?.name || "Server"}</h1>
        </div>""", """        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${isOnline ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.6)] animate-[pulseOrb_2s_ease-in-out_infinite]' : stats.status === 'offline' ? 'bg-zinc-600' : 'bg-amber-400 animate-[pulseOrb_1s_ease-in-out_infinite]'}`} />
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-white truncate drop-shadow-sm">{server?.name || "Server"}</h1>
        </div>""")

with open("src/components/ServerConsole.tsx", "w") as f:
    f.write(content)
