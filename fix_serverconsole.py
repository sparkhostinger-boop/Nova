import re

with open("src/components/ServerConsole.tsx", "r") as f:
    content = f.read()

# Replace StatCard
stat_card_old = r"""const StatCard = \(\{ icon, label, value, dim \}: any\) => \(.*?</div>\s*\);\s*"""
stat_card_new = """const StatCard = ({ icon, label, value, dim }: any) => (
  <div className="relative bg-zinc-950/40 border border-zinc-800/50 backdrop-blur-md rounded-2xl py-4 pr-5 pl-[88px] min-h-[88px] overflow-hidden flex flex-col justify-center transition-all duration-300 hover:bg-zinc-900/60 hover:border-zinc-700/80 shadow-sm hover:shadow-md group">
    <div className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-12 text-zinc-800/60 transition-all duration-500 group-hover:text-zinc-700/80 group-hover:scale-110 pointer-events-none">
      {icon}
    </div>
    <div className="text-xs font-mono tracking-wider uppercase text-zinc-400 mb-1 relative z-10">{label}</div>
    <div className="text-lg sm:text-xl font-display font-bold text-white whitespace-nowrap overflow-hidden text-ellipsis relative z-10">
      {value} {dim && <span className="text-zinc-500 font-medium text-sm sm:text-base ml-1">{dim}</span>}
    </div>
  </div>
);
"""
content = re.sub(stat_card_old, stat_card_new, content, flags=re.DOTALL)

# Replace ChartCard header/container
chart_card_old = r"""<div className="bg-\[\#131010\] rounded-\[10px\] p-\[12px_16px\]">\s*<div className="flex justify-between items-center mb-\[12px\]">\s*<div className="text-\[15px\] font-\[700\] text-white">\{title\}</div>\s*\{icons && <div className="flex gap-\[9px\] items-center">\{icons\}</div>\}\s*</div>\s*<div className="relative h-\[140px\]">"""
chart_card_new = """<div className="bg-zinc-950/40 border border-zinc-800/50 backdrop-blur-md rounded-2xl p-5 shadow-sm hover:border-zinc-700/50 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm font-mono tracking-wider uppercase text-zinc-300 font-bold">{title}</div>
        {icons && <div className="flex gap-2 items-center">{icons}</div>}
      </div>
      <div className="relative h-[150px]">"""
content = content.replace(chart_card_old, chart_card_new)

with open("src/components/ServerConsole.tsx", "w") as f:
    f.write(content)
