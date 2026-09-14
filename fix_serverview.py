import re

with open("src/pages/ServerView.tsx", "r") as f:
    content = f.read()

# Replace bg-[#010101] with bg-zinc-950
content = content.replace("bg-[#010101]", "bg-zinc-950")

# Mobile header
content = content.replace("bg-[#0a0a0c]/90", "bg-zinc-950/90")
content = content.replace("border-[#1f1d1d]", "border-zinc-800")
content = content.replace("bg-[#18181b]", "bg-zinc-900/50")
content = content.replace("hover:bg-[#27272a]", "hover:bg-zinc-800")
content = content.replace("border-[#27272a]", "border-zinc-800")

# Sidebar overlay
content = content.replace("bg-black/75", "bg-black/80")
content = content.replace("bg-[#0c0c0e]", "bg-zinc-950")
content = content.replace("border-[#232020]", "border-zinc-800")
content = content.replace("bg-[#121113]", "bg-zinc-900/30")

# Desktop sidebar
content = content.replace("from-[#010101]/30", "from-zinc-900/20")
content = content.replace("border-[#131010]", "border-zinc-800/50")
content = content.replace("bg-[#131010]", "bg-zinc-800/50")
content = content.replace("hover:bg-[#ffffff20]", "hover:bg-zinc-800")

# Tabs
content = content.replace("bg-[#fb4242]/20", "bg-rose-500/20")
content = content.replace("border-white/20", "border-rose-500/30")
content = content.replace("text-[#fb4242]", "text-rose-500")
content = content.replace("bg-[#fb4242]", "bg-rose-500")

content = content.replace("bg-red-500/15", "bg-rose-500/15")
content = content.replace("border-red-500/30", "border-rose-500/30")
content = content.replace("text-red-400", "text-rose-400")
content = content.replace("bg-red-400", "bg-rose-400")
content = content.replace("border-red-500", "border-rose-500")
content = content.replace("from-red-500", "from-rose-500")

# Inject noise grid for ServerView
inject_style = """
      <div className="flex-1 flex flex-col h-[100dvh] overflow-hidden min-w-0 relative bg-zinc-950">
        <style dangerouslySetInnerHTML={{__html: `
          .server-bg-grid {
              position:absolute; inset:0; z-index:0; pointer-events:none;
              background-image:
                  linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px);
              background-size:40px 40px;
              mask-image:radial-gradient(ellipse 80% 80% at 50% 0%, #000 20%, transparent 100%);
          }
          .server-noise {
              position:absolute; inset:0; z-index:10; pointer-events:none; opacity:.02;
              background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          }
        `}} />
        <div className="server-noise" />
        <div className="server-bg-grid" />
"""
content = content.replace("""<div className="flex-1 flex flex-col h-[100dvh] overflow-hidden min-w-0 relative bg-zinc-950">""", inject_style)

# Also ensure content is above the grid
content = content.replace("""<div className="flex-1 overflow-x-hidden overflow-y-auto">""", """<div className="flex-1 overflow-x-hidden overflow-y-auto relative z-20">""")

with open("src/pages/ServerView.tsx", "w") as f:
    f.write(content)
