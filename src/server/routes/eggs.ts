import express from "express";
import crypto from "crypto";
import { readJSON, writeJSON } from "../services/db.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();
const EGGS_FILE = "eggs.json";

export interface SoftwareEgg {
  id: string;
  name: string;
  type?: string; // e.g. "BETA", "STABLE"
  category: string;
  author: string;
  description: string;
  dockerImage: string;
  startupCommand: string;
  stopCommand: string;
  defaultPort: number;
  mountDir: string;
  versions: string[];
  variables?: {
    name: string;
    env_variable: string;
    default_value: string;
    description?: string;
  }[];
  custom: boolean;
  createdAt: string;
  updatedAt: string;
}

export const PRESET_EGGS: SoftwareEgg[] = [
  {
    id: "egg-paper-mc",
    name: "PaperMC (High Performance)",
    category: "Minecraft Java",
    author: "PaperMC Team",
    description: "High performance Minecraft server fork aiming to fix gameplay and mechanics inconsistencies while improving performance.",
    dockerImage: "itzg/minecraft-server:latest",
    startupCommand: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar paper.jar --nogui",
    stopCommand: "stop",
    defaultPort: 25565,
    mountDir: "/data",
    versions: ["1.21.1", "1.21", "1.20.4", "1.20.2", "1.20.1", "1.19.4", "1.18.2", "1.16.5", "1.12.2", "latest"],
    variables: [
      { name: "Server Jarfile", env_variable: "SERVER_JARFILE", default_value: "paper.jar", description: "Name of the executable jar file" },
      { name: "Online Mode", env_variable: "ONLINE_MODE", default_value: "true", description: "Require genuine Minecraft accounts" }
    ],
    custom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "egg-purpur-mc",
    name: "Purpur (Optimized Vanilla)",
    category: "Minecraft Java",
    author: "PurpurMC",
    description: "Drop-in replacement for Paper servers designed for configurability, new fun mechanics, and high performance.",
    dockerImage: "itzg/minecraft-server:latest",
    startupCommand: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar purpur.jar --nogui",
    stopCommand: "stop",
    defaultPort: 25565,
    mountDir: "/data",
    versions: ["1.21.1", "1.21", "1.20.4", "1.20.2", "1.20.1", "latest"],
    variables: [
      { name: "Server Jarfile", env_variable: "SERVER_JARFILE", default_value: "purpur.jar", description: "Jar file name" }
    ],
    custom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "egg-bedrock-dedicated",
    name: "Bedrock Dedicated Server (BDS)",
    category: "Minecraft Bedrock",
    author: "Mojang",
    description: "Official vanilla dedicated server software for Minecraft Bedrock edition (Mobile, Windows 10, Consoles).",
    dockerImage: "itzg/minecraft-bedrock-server:latest",
    startupCommand: "./bedrock_server",
    stopCommand: "stop",
    defaultPort: 19132,
    mountDir: "/data",
    versions: ["latest", "1.21.20", "1.21.2", "1.21.0", "1.20.81", "1.20.73"],
    variables: [
      { name: "Gamemode", env_variable: "GAMEMODE", default_value: "survival", description: "Default gamemode" },
      { name: "Difficulty", env_variable: "DIFFICULTY", default_value: "easy", description: "Default game difficulty" }
    ],
    custom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "egg-pocketmine-mp",
    name: "PocketMine-MP",
    category: "Minecraft Bedrock",
    author: "PocketMine Team",
    description: "Ultra-fast custom software written in PHP for Minecraft Bedrock Edition servers with powerful plugin API.",
    dockerImage: "ghcr.io/pocketmine/pocketmine-mp:latest",
    startupCommand: "./bin/php7/bin/php ./PocketMine-MP.phar",
    stopCommand: "stop",
    defaultPort: 19132,
    mountDir: "/data",
    versions: ["5.20.0", "5.19.0", "5.18.1", "5.17.0", "latest"],
    variables: [
      { name: "Memory Limit", env_variable: "MEMORY_LIMIT", default_value: "1024M", description: "PHP process memory limit" }
    ],
    custom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "egg-nodejs-bot",
    name: "Node.js Bot & App (v20 LTS)",
    category: "Bots & Web",
    author: "OpenSource",
    description: "Modern Node.js runtime environment perfect for Discord.js bots, Express REST APIs, or background microservices.",
    dockerImage: "node:20-alpine",
    startupCommand: "npm install && node index.js",
    stopCommand: "^C",
    defaultPort: 3000,
    mountDir: "/data",
    versions: ["20.18.0", "22.10.0", "18.20.4", "latest"],
    variables: [
      { name: "Main Script", env_variable: "MAIN_FILE", default_value: "index.js", description: "Entry file for Node.js" },
      { name: "Node Environment", env_variable: "NODE_ENV", default_value: "production", description: "Environment mode" }
    ],
    custom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "egg-python-bot",
    name: "Python Bot & Script (3.11)",
    category: "Bots & Web",
    author: "OpenSource",
    description: "Fast Python 3 runtime for Discord.py / Nextcord bots, Flask, FastAPI web apps, and custom automation scripts.",
    dockerImage: "python:3.11-slim",
    startupCommand: "pip install -r requirements.txt && python3 main.py",
    stopCommand: "^C",
    defaultPort: 8080,
    mountDir: "/data",
    versions: ["3.11.9", "3.12.2", "3.10.14", "latest"],
    variables: [
      { name: "Entry Script", env_variable: "ENTRY_FILE", default_value: "main.py", description: "Python entry script" }
    ],
    custom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "egg-velocity-proxy",
    name: "Velocity Proxy (Modern)",
    category: "Minecraft Proxies",
    author: "PaperMC",
    description: "Next-generation, highly optimized Minecraft proxy software designed for lightning-fast network routing.",
    dockerImage: "itzg/bungeecord:latest",
    startupCommand: "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar velocity.jar",
    stopCommand: "end",
    defaultPort: 25577,
    mountDir: "/server",
    versions: ["3.3.0-SNAPSHOT", "latest"],
    variables: [],
    custom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "egg-terraria-tshock",
    name: "Terraria (tShock Dedicated)",
    category: "Game Servers",
    author: "Pryaxis / tShock",
    description: "High quality dedicated multiplayer server for Terraria with plugin support, anti-cheat, and player management.",
    dockerImage: "ryshe/terraria:latest",
    startupCommand: "./TerrariaServer.bin.x86_64 -port {{SERVER_PORT}} -world /data/world.wld -autocreate 2",
    stopCommand: "exit",
    defaultPort: 7777,
    mountDir: "/data",
    versions: ["1.4.4.9", "1.4.3.6", "latest"],
    variables: [
      { name: "Max Players", env_variable: "MAX_PLAYERS", default_value: "16", description: "Maximum simultaneous players" }
    ],
    custom: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const initEggs = async () => {
  let eggs = await readJSON(EGGS_FILE);
  if (!eggs || !Array.isArray(eggs) || eggs.length === 0) {
    await writeJSON(EGGS_FILE, PRESET_EGGS);
  }
};
initEggs();

// Any authenticated user can list eggs (required for server creation)
router.get("/", requireAuth, async (req, res) => {
  let eggs = await readJSON(EGGS_FILE);
  if (!eggs || !Array.isArray(eggs) || eggs.length === 0) {
    eggs = PRESET_EGGS;
    await writeJSON(EGGS_FILE, eggs);
  }
  res.json(eggs);
});

// Get single egg
router.get("/:id", requireAuth, async (req, res) => {
  const eggs: SoftwareEgg[] = (await readJSON(EGGS_FILE)) || [];
  const egg = eggs.find(e => e.id === req.params.id);
  if (!egg) {
    return res.status(404).json({ error: "Egg not found" });
  }
  res.json(egg);
});

// Admin-only endpoints below
router.use(requireAdmin);

// Create new custom egg
router.post("/", async (req, res) => {
  const {
    name,
    category,
    author,
    description,
    dockerImage,
    startupCommand,
    stopCommand,
    defaultPort,
    mountDir,
    versions,
    variables
  } = req.body;

  if (!name || !dockerImage) {
    return res.status(400).json({ error: "Name and Docker Image are required" });
  }

  const eggs: SoftwareEgg[] = (await readJSON(EGGS_FILE)) || [];
  const { type } = req.body;
  const newEgg: SoftwareEgg = {
    id: `egg-${crypto.randomUUID()}`,
    name: name.trim(),
    type: type ? String(type).trim() : "BETA",
    category: category ? category.trim() : "Custom",
    author: author ? author.trim() : "Admin",
    description: description ? description.trim() : "",
    dockerImage: dockerImage.trim(),
    startupCommand: startupCommand ? startupCommand.trim() : "sh start.sh",
    stopCommand: stopCommand ? stopCommand.trim() : "stop",
    defaultPort: defaultPort ? Number(defaultPort) : 25565,
    mountDir: mountDir ? mountDir.trim() : "/data",
    versions: Array.isArray(versions) && versions.length > 0 
      ? versions.map((v: string) => String(v).trim()).filter(Boolean)
      : ["latest", "1.0.0"],
    variables: Array.isArray(variables) ? variables : [],
    custom: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  eggs.push(newEgg);
  await writeJSON(EGGS_FILE, eggs);
  res.status(201).json(newEgg);
});

// Update an existing egg
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const eggs: SoftwareEgg[] = (await readJSON(EGGS_FILE)) || [];
  const index = eggs.findIndex(e => e.id === id);

  if (index === -1) {
    return res.status(404).json({ error: "Egg not found" });
  }

  const current = eggs[index];
  const {
    name,
    type,
    category,
    author,
    description,
    dockerImage,
    startupCommand,
    stopCommand,
    defaultPort,
    mountDir,
    versions,
    variables
  } = req.body;

  const updated: SoftwareEgg = {
    ...current,
    name: name !== undefined ? String(name).trim() : current.name,
    type: type !== undefined ? String(type).trim() : (current.type || "BETA"),
    category: category !== undefined ? String(category).trim() : current.category,
    author: author !== undefined ? String(author).trim() : current.author,
    description: description !== undefined ? String(description).trim() : current.description,
    dockerImage: dockerImage !== undefined ? String(dockerImage).trim() : current.dockerImage,
    startupCommand: startupCommand !== undefined ? String(startupCommand).trim() : current.startupCommand,
    stopCommand: stopCommand !== undefined ? String(stopCommand).trim() : current.stopCommand,
    defaultPort: defaultPort !== undefined ? Number(defaultPort) : current.defaultPort,
    mountDir: mountDir !== undefined ? String(mountDir).trim() : current.mountDir,
    versions: Array.isArray(versions) 
      ? versions.map((v: string) => String(v).trim()).filter(Boolean)
      : current.versions,
    variables: Array.isArray(variables) ? variables : current.variables,
    updatedAt: new Date().toISOString()
  };

  eggs[index] = updated;
  await writeJSON(EGGS_FILE, eggs);
  res.json(updated);
});

// Delete an egg
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  let eggs: SoftwareEgg[] = (await readJSON(EGGS_FILE)) || [];
  const exists = eggs.some(e => e.id === id);
  if (!exists) {
    return res.status(404).json({ error: "Egg not found" });
  }

  eggs = eggs.filter(e => e.id !== id);
  await writeJSON(EGGS_FILE, eggs);
  res.json({ success: true, message: "Egg deleted successfully" });
});

// Import egg from JSON (supports Pterodactyl egg format and Nova egg format)
router.post("/import", async (req, res) => {
  try {
    const rawData = req.body;
    if (!rawData || typeof rawData !== "object") {
      return res.status(400).json({ error: "Invalid JSON format provided" });
    }

    const eggs: SoftwareEgg[] = (await readJSON(EGGS_FILE)) || [];
    const itemsToImport: any[] = Array.isArray(rawData) ? rawData : [rawData];
    const importedEggs: SoftwareEgg[] = [];

    for (const item of itemsToImport) {
      // Determine if Pterodactyl format or Nova format
      const name = item.name || item.meta?.name || "Imported Software Egg";
      const author = item.author || item.meta?.author || "Community Import";
      const description = item.description || item.meta?.description || "Custom imported software egg";
      
      // Docker images in Pterodactyl can be string or object {"Java 21": "ghcr.io/..."}
      let dockerImage = "itzg/minecraft-server:latest";
      if (typeof item.dockerImage === "string") {
        dockerImage = item.dockerImage;
      } else if (typeof item.image === "string") {
        dockerImage = item.image;
      } else if (typeof item.docker_images === "object" && item.docker_images !== null) {
        const firstVal = Object.values(item.docker_images)[0];
        if (typeof firstVal === "string") dockerImage = firstVal;
      } else if (typeof item.docker_image === "string") {
        dockerImage = item.docker_image;
      }

      const startupCommand = item.startupCommand || item.startup || "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar";
      const stopCommand = item.stopCommand || item.config?.stop || "stop";
      const defaultPort = Number(item.defaultPort || item.port || 25565);
      const mountDir = item.mountDir || (dockerImage.includes("bungee") ? "/server" : "/data");

      // Extract variables
      let variables: any[] = [];
      if (Array.isArray(item.variables)) {
        variables = item.variables.map((v: any) => ({
          name: v.name || v.env_variable || "Variable",
          env_variable: v.env_variable || v.name || "VAR",
          default_value: String(v.default_value ?? v.defaultValue ?? ""),
          description: v.description || ""
        }));
      }

      // Extract versions
      let versions: string[] = [];
      if (Array.isArray(item.versions)) {
        versions = item.versions.map((v: any) => String(v).trim()).filter(Boolean);
      } else if (typeof item.versions === "string") {
        versions = item.versions.split(",").map((v: string) => v.trim()).filter(Boolean);
      }
      if (versions.length === 0) {
        versions = ["latest", "1.0.0"];
      }

      const newEgg: SoftwareEgg = {
        id: `egg-${crypto.randomUUID()}`,
        name,
        category: item.category || "Custom Import",
        author,
        description,
        dockerImage,
        startupCommand,
        stopCommand,
        defaultPort,
        mountDir,
        versions,
        variables,
        custom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      eggs.push(newEgg);
      importedEggs.push(newEgg);
    }

    await writeJSON(EGGS_FILE, eggs);
    res.status(201).json({
      success: true,
      importedCount: importedEggs.length,
      eggs: importedEggs
    });
  } catch (err: any) {
    console.error("Egg import failed:", err);
    res.status(500).json({ error: "Failed to parse and import egg JSON: " + err.message });
  }
});

// Import/Add versions to an egg
router.post("/:id/versions", async (req, res) => {
  const { id } = req.params;
  const { versions, version } = req.body;
  const eggs: SoftwareEgg[] = (await readJSON(EGGS_FILE)) || [];
  const egg = eggs.find(e => e.id === id);

  if (!egg) {
    return res.status(404).json({ error: "Egg not found" });
  }

  let toAdd: string[] = [];
  if (Array.isArray(versions)) {
    toAdd = versions.map((v: any) => String(v).trim()).filter(Boolean);
  } else if (typeof versions === "string") {
    toAdd = versions.split(/[\n,]+/).map((v: string) => v.trim()).filter(Boolean);
  } else if (version) {
    toAdd = [String(version).trim()];
  }

  if (toAdd.length === 0) {
    return res.status(400).json({ error: "No valid versions provided" });
  }

  const existingSet = new Set(egg.versions);
  toAdd.forEach(v => existingSet.add(v));
  egg.versions = Array.from(existingSet);
  egg.updatedAt = new Date().toISOString();

  await writeJSON(EGGS_FILE, eggs);
  res.json({ success: true, versions: egg.versions, egg });
});

// Remove a specific version from an egg
router.delete("/:id/versions/:ver", async (req, res) => {
  const { id, ver } = req.params;
  const eggs: SoftwareEgg[] = (await readJSON(EGGS_FILE)) || [];
  const egg = eggs.find(e => e.id === id);

  if (!egg) {
    return res.status(404).json({ error: "Egg not found" });
  }

  egg.versions = egg.versions.filter(v => v !== decodeURIComponent(ver));
  if (egg.versions.length === 0) {
    egg.versions = ["latest"];
  }
  egg.updatedAt = new Date().toISOString();

  await writeJSON(EGGS_FILE, eggs);
  res.json({ success: true, versions: egg.versions });
});

// Reset to presets
router.post("/presets/reset", async (req, res) => {
  await writeJSON(EGGS_FILE, PRESET_EGGS);
  res.json({ success: true, eggs: PRESET_EGGS });
});

export default router;
