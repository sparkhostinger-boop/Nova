import express from "express";
import { getVersions } from "../services/docker.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import os from "os";
import { exec } from "child_process";
import util from "util";
const execPromise = util.promisify(exec);
import { readJSON, writeJSON } from "../services/db.js";
import bcrypt from "bcryptjs";
import path from "path";
import fs from "fs-extra";
import multer from "multer";
import { ZipArchive } from "archiver";
import extract from "extract-zip";

const router = express.Router();
const uploadBackup = multer({
  dest: path.join(process.cwd(), ".data", "temp"),
  limits: { fileSize: 1024 * 1024 * 1024 } // 1GB max for full backup
});

router.use(requireAdmin);

router.get("/versions", async (req, res) => {
  const type = (req.query.type as string) || "PAPER";
  const versions = await getVersions(type);
  res.json(versions);
});

// Deprecated endpoint for backward compatibility
router.get("/paper-versions", async (req, res) => {
  const versions = await getVersions("PAPER");
  res.json(versions);
});

import { getDocker, isSandbox, mockState } from "../services/docker.js";

function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startCpus = os.cpus();
    setTimeout(() => {
      const endCpus = os.cpus();
      let totalIdle = 0, totalTick = 0;
      
      for (let i = 0, len = startCpus.length; i < len; i++) {
        const start = startCpus[i].times;
        const end = endCpus[i].times;
        
        const startTick = start.user + start.nice + start.sys + start.idle + start.irq;
        const endTick = end.user + end.nice + end.sys + end.idle + end.irq;
        
        const idle = end.idle - start.idle;
        const total = endTick - startTick;
        
        totalIdle += idle;
        totalTick += total;
      }
      
      const usage = 100 - ~~(100 * totalIdle / totalTick);
      resolve(usage);
    }, 100);
  });
}

router.get("/stats", async (req, res) => {
  let diskSpace = 0;
  try {
    const { stdout } = await execPromise("df -h /home");
    const lines = stdout.split("\n");
    if (lines.length > 1) {
      const parts = lines[1].trim().split(/\s+/);
      if (parts.length >= 5) {
        diskSpace = parseInt(parts[4].replace("%", "")) || 0;
      }
    }
  } catch (err) {}
  
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  
  let cpuUsage = await getCpuUsage();
  
  let activeContainers = 0;
  let totalContainers = 0;
  
  try {
    if (isSandbox) {
       totalContainers = Object.keys(mockState).length;
       activeContainers = Object.values(mockState).filter(v => v).length;
    } else {
       const docker = await getDocker();
       const containers = await docker.listContainers({ all: true });
       totalContainers = containers.length;
       activeContainers = containers.filter(c => c.State === 'running').length;
    }
  } catch (err) {
     // fallback
  }
  
  res.json({
    cpuUsage: cpuUsage,
    totalMemory,
    freeMemory,
    ramUsage: Math.round(((totalMemory - freeMemory) / totalMemory) * 100),
    diskUsage: diskSpace,
    activeContainers,
    totalContainers
  });
});

router.get("/users", async (req, res) => {
  const user = (req as any).user;
  if(user.role !== "admin" && user.role !== "owner") return res.status(403).json({ error: "Forbidden"});
  const users = await readJSON("users.json") || [];
  res.json(users.map((u: any) => ({ 
    id: u.id, 
    username: u.username, 
    role: u.role || 'admin', 
    password: u.rawPassword || (u.googleId ? 'Google Account' : (u.password && !u.password.startsWith('$2') ? u.password : '••••••••')),
    isGoogleUser: !!u.googleId, 
    createdAt: u.createdAt 
  })));
});

router.post("/users", async (req, res) => {
  const user = (req as any).user;
  if(user.role !== "admin" && user.role !== "owner") return res.status(403).json({ error: "Forbidden"});
  const { username, password, role } = req.body;
  if (!username || !password || !role) return res.status(400).json({ error: "Missing fields" });

  const users = await readJSON("users.json") || [];
  if (users.find((u: any) => u.username === username)) return res.status(400).json({ error: "Username taken" });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUserId = Date.now().toString();
  users.push({
    id: newUserId,
    username,
    password: hashedPassword,
    rawPassword: password,
    role,
    createdAt: new Date().toISOString()
  });

  await writeJSON("users.json", users);
  res.json({ success: true, id: newUserId, username, role, password });
});

router.delete("/users/:id", async (req, res) => {
  const user = (req as any).user;
  if(user.role !== "admin" && user.role !== "owner") return res.status(403).json({ error: "Forbidden"});
  
  const target = req.params.id;
  let users = await readJSON("users.json") || [];
  const targetUser = users.find((u: any) => u.id === target || u.username === target);
  
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }
  
  if (targetUser.username === "admin" && targetUser.id === "dev-user-f7aj6mlbs") {
    return res.status(400).json({ error: "Cannot delete primary admin account" });
  }

  users = users.filter((u: any) => u.id !== target && u.username !== target);
  await writeJSON("users.json", users);
  res.json({ success: true, message: "User deleted successfully" });
});


router.put("/users/:id/password", async (req, res) => {
  const user = (req as any).user;
  if(user.role !== "admin" && user.role !== "owner") return res.status(403).json({ error: "Forbidden"});
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters" });
  }
  
  const users = await readJSON("users.json") || [];
  const targetIndex = users.findIndex((u: any) => u.id === req.params.id);
  if (targetIndex === -1) return res.status(404).json({ error: "User not found" });
  
  if (users[targetIndex].id === "temp-admin") {
    return res.status(400).json({ error: "Cannot change password of default admin account." });
  }

  if (users[targetIndex].googleId || !users[targetIndex].password) {
    return res.status(400).json({ error: "Cannot change password for Google authenticated accounts." });
  }
  
  const bcrypt = await import("bcryptjs");
  const hashedPassword = await bcrypt.default.hash(newPassword, 10);
  users[targetIndex].password = hashedPassword;
  users[targetIndex].rawPassword = newPassword;
  users[targetIndex].passwordVersion = (users[targetIndex].passwordVersion || 0) + 1;
  await writeJSON("users.json", users);
  res.json({ success: true });
});

router.put("/settings", async (req, res) => {
  const user = (req as any).user;
  if(user.role !== "admin" && user.role !== "owner") return res.status(403).json({ error: "Forbidden"});
  const { 
    panelName, panelLogo, panelBackgroundImage, panelBackgroundBlur, 
    themePrimaryColor, themeTextColor, themeBgColor,
    enablePlayit, enableTutorial, enableLoginAnimation, enableRegistration, theme,
    enableGoogleLogin, googleClientId, firebaseApiKey, firebaseAuthDomain, firebaseProjectId,
    firebaseStorageBucket, firebaseMessagingSenderId, firebaseAppId,
    addons
  } = req.body;
  const settings = await readJSON("settings.json") || {};
  if (panelName !== undefined) {
    settings.panelName = panelName || "SH Panel";
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const targetPaths = [
        path.join(process.cwd(), "index.html"),
        path.join(process.cwd(), "dist", "index.html")
      ];
      for (const p of targetPaths) {
        try {
          let html = await fs.readFile(p, "utf-8");
          html = html.replace(/<title>.*<\/title>/i, `<title>${settings.panelName}</title>`);
          await fs.writeFile(p, html, "utf-8");
        } catch (e) {
          // Ignore if file doesn't exist
        }
      }
    } catch (err) {
      console.error("Error updating html title:", err);
    }
  }
  if (panelLogo !== undefined) settings.panelLogo = panelLogo;
  if (panelBackgroundImage !== undefined) settings.panelBackgroundImage = panelBackgroundImage;
  if (panelBackgroundBlur !== undefined) settings.panelBackgroundBlur = panelBackgroundBlur;
  if (themePrimaryColor !== undefined) settings.themePrimaryColor = themePrimaryColor;
  if (themeTextColor !== undefined) settings.themeTextColor = themeTextColor;
  if (themeBgColor !== undefined) settings.themeBgColor = themeBgColor;
  if (enablePlayit !== undefined) settings.enablePlayit = enablePlayit;
  if (enableTutorial !== undefined) settings.enableTutorial = enableTutorial;
  if (enableLoginAnimation !== undefined) settings.enableLoginAnimation = enableLoginAnimation;
  if (enableRegistration !== undefined) settings.enableRegistration = enableRegistration;
  if (theme !== undefined) settings.theme = theme;
  if (enableGoogleLogin !== undefined) settings.enableGoogleLogin = enableGoogleLogin;
  if (googleClientId !== undefined) settings.googleClientId = googleClientId;
  if (firebaseApiKey !== undefined) settings.firebaseApiKey = firebaseApiKey;
  if (firebaseAuthDomain !== undefined) settings.firebaseAuthDomain = firebaseAuthDomain;
  if (firebaseProjectId !== undefined) settings.firebaseProjectId = firebaseProjectId;
  if (firebaseStorageBucket !== undefined) settings.firebaseStorageBucket = firebaseStorageBucket;
  if (firebaseMessagingSenderId !== undefined) settings.firebaseMessagingSenderId = firebaseMessagingSenderId;
  if (firebaseAppId !== undefined) settings.firebaseAppId = firebaseAppId;
  if (addons !== undefined) settings.addons = addons;
  await writeJSON("settings.json", settings);
  req.app.get("io")?.emit("settings_updated");
  res.json({ success: true });
});

router.post("/update", async (req, res) => {
  const user = (req as any).user;
  if(user.role !== "admin" && user.role !== "owner") return res.status(403).json({ error: "Forbidden"});

  // Broadcast to all clients to refresh in a few seconds
  const io = req.app.get("io");
  if (io) {
    io.emit("system_update_started");
  }

  res.json({ success: true, message: "Update process started" });

  const { exec } = await import("child_process");
  setTimeout(() => {
    exec("bash update.sh", (error, stdout, stderr) => {
      console.log(`Update stdout: ${stdout}`);
      console.error(`Update stderr: ${stderr}`);
    });
  }, 1000);
});





function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

router.get("/backup/info", async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "owner") {
    return res.status(403).json({ error: "Forbidden: Admin privileges required" });
  }

  try {
    const servers = await readJSON("servers.json") || [];
    const users = await readJSON("users.json") || [];
    const nodes = await readJSON("nodes.json") || [];
    const dataDir = path.join(process.cwd(), ".data");

    let totalBytes = 0;
    const calculateDirSize = async (dir: string) => {
      if (!(await fs.pathExists(dir))) return;
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name !== "temp" && entry.name !== "backups") {
            await calculateDirSize(full);
          }
        } else if (entry.isFile()) {
          const st = await fs.stat(full);
          totalBytes += st.size;
        }
      }
    };
    await calculateDirSize(dataDir);

    res.json({
      serversCount: servers.length,
      usersCount: users.length,
      nodesCount: nodes.length,
      estimatedSizeBytes: totalBytes,
      estimatedSizeFormatted: formatBytes(totalBytes)
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/backup/download", async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "owner") {
    return res.status(403).json({ error: "Forbidden: Admin privileges required" });
  }

  try {
    const dataDir = path.join(process.cwd(), ".data");
    await fs.ensureDir(dataDir);

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const backupFilename = `nova-panel-backup-${timestamp}.zip`;

    const servers = await readJSON("servers.json") || [];
    const users = await readJSON("users.json") || [];
    const settings = await readJSON("settings.json") || {};
    const nodes = await readJSON("nodes.json") || [];

    const manifest = {
      panelName: settings.panelName || "SH Panel",
      version: "2.0.0",
      createdAt: now.toISOString(),
      serversCount: servers.length,
      usersCount: users.length,
      nodesCount: nodes.length,
      includesServerFiles: true
    };

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${backupFilename}"`);

    const archive = new ZipArchive({ zlib: { level: 9 } });

    archive.on("error", (err: any) => {
      console.error("Panel Backup Archive Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate backup archive: " + err.message });
      }
    });

    archive.pipe(res);

    // 1. Add manifest
    archive.append(JSON.stringify(manifest, null, 2), { name: "backup-manifest.json" });

    // 2. Add all JSON files in .data
    const files = await fs.readdir(dataDir);
    for (const file of files) {
      if (file.endsWith(".json")) {
        const filePath = path.join(dataDir, file);
        archive.file(filePath, { name: file });
      }
    }

    // 3. Add servers directory (server configs, worlds, plugins, mods, properties)
    const serversDir = path.join(dataDir, "servers");
    if (await fs.pathExists(serversDir)) {
      archive.directory(serversDir, "servers");
    }

    // 4. Add ssh directory if exists
    const sshDir = path.join(dataDir, "ssh");
    if (await fs.pathExists(sshDir)) {
      archive.directory(sshDir, "ssh");
    }

    await archive.finalize();
  } catch (err: any) {
    console.error("Backup creation failed:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message || "Failed to create backup" });
    }
  }
});

router.post("/backup/restore-chunk", uploadBackup.single("chunk"), async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "owner") {
    return res.status(403).json({ error: "Forbidden: Admin privileges required" });
  }

  const { fileId, chunkIndex } = req.body;
  if (!req.file || !fileId || chunkIndex === undefined) {
    return res.status(400).json({ error: "Missing chunk data" });
  }

  try {
    const chunksDir = path.join(process.cwd(), ".data", "temp", `chunks-${fileId}`);
    await fs.ensureDir(chunksDir);

    const chunkPath = path.join(chunksDir, chunkIndex.toString());
    await fs.move(req.file.path, chunkPath, { overwrite: true });
    
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error saving chunk:", err);
    res.status(500).json({ error: "Failed to save chunk" });
  }
});

router.post("/backup/restore-process", express.json(), async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "owner") {
    return res.status(403).json({ error: "Forbidden: Admin privileges required" });
  }

  const { fileId } = req.body;
  if (!fileId) return res.status(400).json({ error: "Missing fileId" });

  const chunksDir = path.join(process.cwd(), ".data", "temp", `chunks-${fileId}`);
  if (!(await fs.pathExists(chunksDir))) {
    return res.status(400).json({ error: "Chunks not found" });
  }

  const finalZipPath = path.join(process.cwd(), ".data", "temp", `restore-${fileId}.zip`);
  const tempExtractDir = path.join(process.cwd(), ".data", "temp", `restore-ext-${fileId}`);

  try {
    const chunks = await fs.readdir(chunksDir);
    chunks.sort((a, b) => parseInt(a) - parseInt(b));

    const writeStream = fs.createWriteStream(finalZipPath);
    for (const chunk of chunks) {
      const chunkPath = path.join(chunksDir, chunk);
      const data = await fs.readFile(chunkPath);
      writeStream.write(data);
    }
    writeStream.end();

    await new Promise((resolve, reject) => {
      writeStream.on("finish", () => resolve(undefined));
      writeStream.on("error", reject);
    });

    await fs.remove(chunksDir);

    await fs.ensureDir(tempExtractDir);
    await extract(finalZipPath, { dir: tempExtractDir });

    // Find root folder if wrapped in a single folder
    let sourceDir = tempExtractDir;
    const rootEntries = await fs.readdir(tempExtractDir);
    if (rootEntries.length === 1) {
      const subPath = path.join(tempExtractDir, rootEntries[0]);
      const stat = await fs.stat(subPath);
      if (stat.isDirectory()) {
        sourceDir = subPath;
      }
    }

    // Check validity
    const hasServers = await fs.pathExists(path.join(sourceDir, "servers.json"));
    const hasUsers = await fs.pathExists(path.join(sourceDir, "users.json"));
    const hasSettings = await fs.pathExists(path.join(sourceDir, "settings.json"));
    const hasManifest = await fs.pathExists(path.join(sourceDir, "backup-manifest.json"));

    if (!hasServers && !hasUsers && !hasSettings && !hasManifest) {
      throw new Error("Invalid backup file: Could not find panel data structure in the archive.");
    }

    const dataDir = path.join(process.cwd(), ".data");
    await fs.ensureDir(dataDir);

    // Safeguard current admin account
    const currentUsers = await readJSON("users.json") || [];
    const currentAdmin = currentUsers.find((u: any) => u.id === user.id || u.username === user.username);

    // 1. Restore JSON files
    const extractedFiles = await fs.readdir(sourceDir);
    let restoredServerCount = 0;
    let restoredUserCount = 0;

    for (const f of extractedFiles) {
      if (f.endsWith(".json") && f !== "backup-manifest.json") {
        const srcJsonPath = path.join(sourceDir, f);
        
        if (f === "users.json") {
          const backupUsers = await fs.readJson(srcJsonPath);
          if (Array.isArray(backupUsers)) {
            if (currentAdmin && !backupUsers.some((u: any) => u.id === currentAdmin.id || u.username === currentAdmin.username)) {
              backupUsers.push(currentAdmin);
            }
            await writeJSON("users.json", backupUsers);
            restoredUserCount = backupUsers.length;
          }
        } else {
          const content = await fs.readJson(srcJsonPath);
          await writeJSON(f, content);
          if (f === "servers.json" && Array.isArray(content)) {
            restoredServerCount = content.length;
          }
        }
      }
    }

    // 2. Restore servers directory
    const srcServersDir = path.join(sourceDir, "servers");
    if (await fs.pathExists(srcServersDir)) {
      const destServersDir = path.join(dataDir, "servers");
      await fs.ensureDir(destServersDir);
      await fs.copy(srcServersDir, destServersDir, { overwrite: true });
    }

    // 3. Restore ssh directory if present
    const srcSshDir = path.join(sourceDir, "ssh");
    if (await fs.pathExists(srcSshDir)) {
      const destSshDir = path.join(dataDir, "ssh");
      await fs.ensureDir(destSshDir);
      await fs.copy(srcSshDir, destSshDir, { overwrite: true });
    }

    // Notify connected clients
    const io = req.app.get("io");
    if (io) {
      io.emit("settings_updated");
      io.emit("servers_updated");
    }

    // Clean up
    await fs.remove(finalZipPath);
    await fs.remove(tempExtractDir);

    res.json({
      success: true,
      message: "Panel backup restored successfully!",
      stats: {
        serversRestored: restoredServerCount,
        usersRestored: restoredUserCount,
        restoredAt: new Date().toISOString()
      }
    });
  } catch (err: any) {
    console.error("Restore backup error:", err);
    try {
      if (await fs.pathExists(finalZipPath)) await fs.remove(finalZipPath);
      if (await fs.pathExists(tempExtractDir)) await fs.remove(tempExtractDir);
      if (await fs.pathExists(chunksDir)) await fs.remove(chunksDir);
    } catch (e) {}

    res.status(500).json({ error: err.message || "Failed to restore backup" });
  }
});

// Detailed per-server data inventory for Admin Backups
router.get("/backup/servers/stats", async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "owner") {
    return res.status(403).json({ error: "Forbidden: Admin privileges required" });
  }

  try {
    const servers = await readJSON("servers.json") || [];
    const serverStats = await Promise.all(servers.map(async (server: any) => {
      const serverDir = path.join(process.cwd(), ".data", "servers", server.id);
      const backupsDir = path.join(process.cwd(), ".data", "backups", server.id);

      let totalBytes = 0;
      let pluginCount = 0;
      let modCount = 0;
      let playerDataCount = 0;
      let worldSizeBytes = 0;
      let backupsCount = 0;

      const calcSize = async (dirPath: string) => {
        if (!(await fs.pathExists(dirPath))) return 0;
        let bytes = 0;
        try {
          const entries = await fs.readdir(dirPath, { withFileTypes: true });
          for (const entry of entries) {
            const full = path.join(dirPath, entry.name);
            if (entry.isDirectory()) {
              bytes += await calcSize(full);
            } else if (entry.isFile()) {
              const st = await fs.stat(full);
              bytes += st.size;
            }
          }
        } catch (e) {}
        return bytes;
      };

      if (await fs.pathExists(serverDir)) {
        totalBytes = await calcSize(serverDir);

        // Count plugins
        const pluginsDir = path.join(serverDir, "plugins");
        if (await fs.pathExists(pluginsDir)) {
          const pEntries = await fs.readdir(pluginsDir);
          pluginCount = pEntries.filter(f => f.endsWith(".jar")).length;
        }

        // Count mods
        const modsDir = path.join(serverDir, "mods");
        if (await fs.pathExists(modsDir)) {
          const mEntries = await fs.readdir(modsDir);
          modCount = mEntries.filter(f => f.endsWith(".jar")).length;
        }

        // Count player data
        const searchPlayerData = async (wName: string) => {
          const pdDir = path.join(serverDir, wName, "playerdata");
          if (await fs.pathExists(pdDir)) {
            const files = await fs.readdir(pdDir);
            playerDataCount += files.filter(f => f.endsWith(".dat") || f.endsWith(".json")).length;
          }
          const statsDir = path.join(serverDir, wName, "stats");
          if (await fs.pathExists(statsDir)) {
            const stFiles = await fs.readdir(statsDir);
            playerDataCount += stFiles.filter(f => f.endsWith(".json")).length;
          }
        };

        await searchPlayerData("world");
        await searchPlayerData("world_nether");
        await searchPlayerData("world_the_end");
        await searchPlayerData("Bedrock level");

        // World size
        const worldDir = path.join(serverDir, "world");
        if (await fs.pathExists(worldDir)) {
          worldSizeBytes = await calcSize(worldDir);
        }
      }

      if (await fs.pathExists(backupsDir)) {
        const bFiles = await fs.readdir(backupsDir);
        backupsCount = bFiles.filter(f => f.endsWith(".zip")).length;
      }

      return {
        id: server.id,
        name: server.name || server.id,
        software: server.software || "Paper",
        version: server.version || "Latest",
        port: server.port || 25565,
        status: server.status || "offline",
        memory: server.memory || 1024,
        totalSizeBytes: totalBytes,
        totalSizeFormatted: formatBytes(totalBytes),
        worldSizeBytes,
        worldSizeFormatted: formatBytes(worldSizeBytes),
        pluginCount,
        modCount,
        playerDataCount,
        backupsCount
      };
    }));

    res.json(serverStats);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// Download complete on-demand backup for a specific server (with plugins, player data, world files, server.properties, etc.)
router.get("/backup/servers/:id/download", async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "owner") {
    return res.status(403).json({ error: "Forbidden: Admin privileges required" });
  }

  const { id } = req.params;
  try {
    const servers = await readJSON("servers.json") || [];
    const server = servers.find((s: any) => s.id === id);
    const serverName = (server?.name || id).replace(/[^a-zA-Z0-9_-]/g, "_");
    const serverDir = path.join(process.cwd(), ".data", "servers", id);

    if (!(await fs.pathExists(serverDir))) {
      await fs.ensureDir(serverDir);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const filename = `${serverName}-full-backup-${timestamp}.zip`;

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const archive = new ZipArchive({ zlib: { level: 9 } });

    archive.on("error", (err: any) => {
      console.error("Server Backup Archive Error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to create server backup: " + err.message });
      }
    });

    archive.pipe(res);

    // Embed metadata
    const meta = {
      serverId: id,
      serverName: server?.name || id,
      software: server?.software || "Minecraft",
      version: server?.version || "",
      exportedAt: new Date().toISOString(),
      includes: ["plugins", "playerdata", "world", "server.properties", "configs", "mods"]
    };
    archive.append(JSON.stringify(meta, null, 2), { name: "server-backup-manifest.json" });

    // Include entire server directory
    archive.directory(serverDir, false);

    await archive.finalize();
  } catch (e: any) {
    console.error("Failed to stream server backup:", e);
    if (!res.headersSent) {
      res.status(500).json({ error: e.message || "Failed to download server backup" });
    }
  }
});

// Restore backup specifically to a server
router.post("/backup/servers/:id/restore", uploadBackup.single("backup"), async (req, res) => {
  const user = (req as any).user;
  if (user.role !== "admin" && user.role !== "owner") {
    return res.status(403).json({ error: "Forbidden: Admin privileges required" });
  }

  const { id } = req.params;
  if (!req.file) {
    return res.status(400).json({ error: "No backup file uploaded" });
  }

  const uploadedFilePath = req.file.path;
  const tempExtractDir = path.join(process.cwd(), ".data", "temp", `restore-srv-${id}-${Date.now()}`);
  const destServerDir = path.join(process.cwd(), ".data", "servers", id);

  try {
    await fs.ensureDir(tempExtractDir);
    await extract(uploadedFilePath, { dir: tempExtractDir });

    // Handle nested folder if wrapped
    let sourceDir = tempExtractDir;
    const entries = await fs.readdir(tempExtractDir);
    if (entries.length === 1) {
      const sub = path.join(tempExtractDir, entries[0]);
      if ((await fs.stat(sub)).isDirectory()) {
        sourceDir = sub;
      }
    }

    await fs.ensureDir(destServerDir);
    await fs.copy(sourceDir, destServerDir, { overwrite: true });

    // Cleanup
    await fs.remove(uploadedFilePath);
    await fs.remove(tempExtractDir);

    const io = req.app.get("io");
    if (io) {
      io.emit("servers_updated");
    }

    res.json({
      success: true,
      message: `Server backup restored successfully into server ${id}`
    });
  } catch (err: any) {
    try {
      if (await fs.pathExists(uploadedFilePath)) await fs.remove(uploadedFilePath);
      if (await fs.pathExists(tempExtractDir)) await fs.remove(tempExtractDir);
    } catch (e) {}
    res.status(500).json({ error: err.message || "Failed to restore server backup" });
  }
});

export default router;

