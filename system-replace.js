const fs = require('fs');

const content = fs.readFileSync('src/server/routes/system.ts', 'utf-8');

const targetStr = `router.post("/backup/restore", uploadBackup.single("backup"), async (req, res) => {`;
const startIndex = content.indexOf(targetStr);

const endStr = `  }
});`;
const endIndex = content.indexOf(endStr, startIndex) + endStr.length;

const newCode = `router.post("/backup/restore-chunk", uploadBackup.single("chunk"), async (req, res) => {
  const user = req.user;
  if (user.role !== "admin" && user.role !== "owner") return res.status(403).json({ error: "Forbidden: Admin privileges required" });

  const { fileId, chunkIndex, totalChunks } = req.body;
  if (!req.file || !fileId || chunkIndex === undefined || !totalChunks) {
    return res.status(400).json({ error: "Missing chunk data" });
  }

  try {
    const chunksDir = require("path").join(process.cwd(), ".data", "temp", \`chunks-\${fileId}\`);
    await fs.ensureDir(chunksDir);
    await fs.move(req.file.path, require("path").join(chunksDir, chunkIndex.toString()), { overwrite: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save chunk" });
  }
});

router.post("/backup/restore-process", async (req, res) => {
  const user = req.user;
  if (user.role !== "admin" && user.role !== "owner") return res.status(403).json({ error: "Forbidden: Admin privileges required" });

  const { fileId } = req.body;
  if (!fileId) return res.status(400).json({ error: "Missing fileId" });

  const path = require("path");
  const chunksDir = path.join(process.cwd(), ".data", "temp", \`chunks-\${fileId}\`);
  const finalZipPath = path.join(process.cwd(), ".data", "temp", \`restore-\${fileId}.zip\`);
  const tempExtractDir = path.join(process.cwd(), ".data", "temp", \`restore-ext-\${fileId}\`);

  try {
    if (!(await fs.pathExists(chunksDir))) throw new Error("Chunks not found");

    const chunks = await fs.readdir(chunksDir);
    chunks.sort((a, b) => parseInt(a) - parseInt(b));

    const writeStream = require("fs").createWriteStream(finalZipPath);
    for (const chunk of chunks) {
      const data = await fs.readFile(path.join(chunksDir, chunk));
      writeStream.write(data);
    }
    writeStream.end();
    await new Promise((resolve, reject) => { writeStream.on("finish", resolve); writeStream.on("error", reject); });
    await fs.remove(chunksDir);

    await fs.ensureDir(tempExtractDir);
    const extract = (await import("extract-zip")).default;
    await extract(finalZipPath, { dir: tempExtractDir });

    let sourceDir = tempExtractDir;
    const rootEntries = await fs.readdir(tempExtractDir);
    if (rootEntries.length === 1) {
      const subPath = path.join(tempExtractDir, rootEntries[0]);
      if ((await fs.stat(subPath)).isDirectory()) sourceDir = subPath;
    }

    const hasServers = await fs.pathExists(path.join(sourceDir, "servers.json"));
    const hasUsers = await fs.pathExists(path.join(sourceDir, "users.json"));
    if (!hasServers && !hasUsers) throw new Error("Invalid backup file: Could not find panel data.");

    const dataDir = path.join(process.cwd(), ".data");
    await fs.ensureDir(dataDir);

    const currentUsers = await readJSON("users.json") || [];
    const currentAdmin = currentUsers.find(u => u.id === user.id || u.username === user.username);

    const extractedFiles = await fs.readdir(sourceDir);
    let restoredServerCount = 0;
    let restoredUserCount = 0;

    for (const f of extractedFiles) {
      if (f.endsWith(".json") && f !== "backup-manifest.json") {
        const srcJsonPath = path.join(sourceDir, f);
        if (f === "users.json") {
          const backupUsers = await fs.readJson(srcJsonPath);
          if (Array.isArray(backupUsers)) {
            if (currentAdmin && !backupUsers.some(u => u.id === currentAdmin.id || u.username === currentAdmin.username)) {
              backupUsers.push(currentAdmin);
            }
            await writeJSON("users.json", backupUsers);
            restoredUserCount = backupUsers.length;
          }
        } else {
          const content = await fs.readJson(srcJsonPath);
          await writeJSON(f, content);
          if (f === "servers.json" && Array.isArray(content)) restoredServerCount = content.length;
        }
      }
    }

    const srcServersDir = path.join(sourceDir, "servers");
    if (await fs.pathExists(srcServersDir)) await fs.copy(srcServersDir, path.join(dataDir, "servers"), { overwrite: true });

    const srcSshDir = path.join(sourceDir, "ssh");
    if (await fs.pathExists(srcSshDir)) await fs.copy(srcSshDir, path.join(dataDir, "ssh"), { overwrite: true });

    const io = req.app.get("io");
    if (io) {
      io.emit("settings_updated");
      io.emit("servers_updated");
    }

    await fs.remove(finalZipPath);
    await fs.remove(tempExtractDir);

    res.json({
      success: true,
      message: "Panel backup restored successfully!",
      stats: { serversRestored: restoredServerCount, usersRestored: restoredUserCount }
    });
  } catch (err) {
    console.error("Restore error:", err);
    await fs.remove(finalZipPath).catch(() => {});
    await fs.remove(tempExtractDir).catch(() => {});
    if (!res.headersSent) res.status(500).json({ error: err.message || "Failed to restore backup" });
  }
});`;

const newFileContent = content.substring(0, startIndex) + newCode + content.substring(endIndex);
fs.writeFileSync('src/server/routes/system.ts', newFileContent);
console.log("Replaced backup endpoints");
