import "dotenv/config";
import express from "express";
import path from "path";
import cors from "cors";
import compression from "compression";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createViteServer } from "vite";
import fs from "fs-extra";
import jwt from "jsonwebtoken";

const app = express();
app.disable("x-powered-by");

const httpServer = createServer(app);
export const io = new SocketIOServer(httpServer, {
  cors: { origin: "*" },
  pingTimeout: 30000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6, // 1MB buffer limit to prevent RAM exhaustion
  perMessageDeflate: false, // Save ~256KB RAM per connected socket client
});
app.set("io", io);
setDockerIO(io);

// Initialize data folders
const DATA_DIR = path.join(process.cwd(), ".data");
const SERVERS_DIR = path.join(DATA_DIR, "servers");
const BACKUPS_DIR = path.join(process.cwd(), "backups");

fs.ensureDirSync(DATA_DIR);
fs.ensureDirSync(SERVERS_DIR);
fs.ensureDirSync(BACKUPS_DIR);
fs.ensureDirSync(path.join(DATA_DIR, "temp"));

if (!fs.existsSync(path.join(DATA_DIR, "users.json"))) fs.writeFileSync(path.join(DATA_DIR, "users.json"), "[]");
try {
  const usersPath = path.join(DATA_DIR, "users.json");
  const raw = fs.readFileSync(usersPath, "utf8");
  const usersList = JSON.parse(raw || "[]");
  if (!Array.isArray(usersList) || !usersList.some((u: any) => u.username === "admin" && (u.role === "admin" || u.role === "owner"))) {
    const defaultAdmin = {
      id: "dev-user-f7aj6mlbs",
      username: "admin",
      email: "admin@novapanel.local",
      password: "$2b$10$YnEq9MIaIamycF61P/CCMew4.3lV70oZWfKYab3QnZj3IEQte3cnS",
      rawPassword: "admin",
      role: "admin",
      passwordVersion: 0,
      createdAt: new Date().toISOString()
    };
    const adminIdx = Array.isArray(usersList) ? usersList.findIndex((u: any) => u.username === "admin") : -1;
    if (adminIdx !== -1) {
      usersList[adminIdx] = { ...usersList[adminIdx], ...defaultAdmin };
    } else {
      (usersList as any[]).push(defaultAdmin);
    }
    fs.writeFileSync(usersPath, JSON.stringify(usersList, null, 2));
  }
} catch (e) {
  console.error("Error ensuring default admin user:", e);
}
if (!fs.existsSync(path.join(DATA_DIR, "servers.json"))) fs.writeFileSync(path.join(DATA_DIR, "servers.json"), "[]");
if (!fs.existsSync(path.join(DATA_DIR, "settings.json"))) fs.writeFileSync(path.join(DATA_DIR, "settings.json"), "{}");

import { attachContainerSocket, getContainerLogs, setDockerIO } from "./src/server/services/docker.js";

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error"));
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET || "jtg-panel-super-secret");
    (socket as any).user = verified;
    next();
  } catch (err) {
    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  socket.on("joinServer", async (serverId) => {
    socket.join(`server_${serverId}`);
    
    // Ensure logs are streamed if container is already running
    try {
      const serversJSON = await fs.readFile(path.join(DATA_DIR, "servers.json"), "utf8");
      const servers = JSON.parse(serversJSON);
      const server = Array.isArray(servers) ? servers.find((s: any) => s.id === serverId) : null;
      if (server && server.containerId) {
        const logs = await getContainerLogs(server.containerId);
        if (logs) {
           socket.emit("log", logs.trim() + "\n");
        }
        await attachContainerSocket(server.containerId, serverId);
      }
    } catch (e) {
      console.error(e);
    }
  });
  socket.on("leaveServer", (serverId) => {
    socket.leave(`server_${serverId}`);
  });
});

const isDev = process.env.NODE_ENV !== "production";
const PORT = 3000;

app.use(compression({
  threshold: 1024,
  level: 6
}));

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cors());

// Periodically run garbage collection when enabled to free heap memory
setInterval(() => {
  if (typeof (global as any).gc === "function") {
    try {
      (global as any).gc();
    } catch (e) {}
  }
}, 180000);

import apiRoutes from "./src/server/routes/api.js";
app.use("/api", apiRoutes);

import { initSFTPServer } from "./src/server/services/sftp.js";

async function startServer() {
  await initSFTPServer();

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, {
      maxAge: "1d",
      etag: true,
      lastModified: true
    }));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const HOST = process.env.HOST || "::";

  const server = httpServer.listen(PORT, HOST, () => {
    console.log(`Nova Panel running on port ${PORT}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EAFNOSUPPORT" || err.code === "EADDRNOTAVAIL") {
      httpServer.listen(PORT, "0.0.0.0", () => {
        console.log(`Nova Panel running on port ${PORT} (IPv4 fallback)`);
      });
    } else {
      console.error("Server listen error:", err);
    }
  });
}

startServer();

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  fs.writeFileSync('crash.log', String(err.stack));
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  fs.writeFileSync('crash.log', String(reason));
});
