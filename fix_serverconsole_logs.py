with open("src/components/ServerConsole.tsx", "r") as f:
    content = f.read()

content = content.replace("text-[#e8bd15]", "text-amber-400")
content = content.replace("text-[#8f8f8f]", "text-zinc-500")
content = content.replace("text-[#c9c9c9]", "text-zinc-300")
content = content.replace("text-[#22d3ee]", "text-cyan-400")

with open("src/components/ServerConsole.tsx", "w") as f:
    f.write(content)
