import { readJSON, writeJSON } from "./db.js";
import { Request } from "express";

export type AuditAction = 
  | "SERVER_START"
  | "SERVER_STOP"
  | "SERVER_RESTART"
  | "FILE_DELETE"
  | "SERVER_DELETE"
  | "SERVER_CREATE"
  | "SERVER_COMMAND"
  | "BACKUP_DELETE";

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  serverId?: string;
  serverName?: string;
  userId: string;
  username: string;
  userRole?: string;
  ip: string;
  details: string;
  metadata?: Record<string, any>;
  status: "success" | "failed";
}

export const logAudit = async (params: {
  req?: Request;
  action: AuditAction;
  serverId?: string;
  serverName?: string;
  userId?: string;
  username?: string;
  userRole?: string;
  details: string;
  metadata?: Record<string, any>;
  status?: "success" | "failed";
}) => {
  try {
    const req = params.req;
    const user = (req as any)?.user;

    const rawIp = req
      ? (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || req.socket?.remoteAddress || "127.0.0.1"
      : "127.0.0.1";
    
    // Clean up IPv6 mapped IPv4 like ::ffff:127.0.0.1
    const cleanIp = rawIp.replace(/^.*:/, "") || rawIp;

    const entry: AuditLogEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      timestamp: new Date().toISOString(),
      action: params.action,
      serverId: params.serverId,
      serverName: params.serverName,
      userId: params.userId || user?.id || "system",
      username: params.username || user?.username || "admin",
      userRole: params.userRole || user?.role || "admin",
      ip: cleanIp === "1" ? "127.0.0.1" : cleanIp,
      details: params.details,
      metadata: params.metadata,
      status: params.status || "success"
    };

    const logs: AuditLogEntry[] = (await readJSON("audit_logs.json")) || [];
    logs.unshift(entry);

    // Keep up to 2,000 logs in rotation
    if (logs.length > 2000) {
      logs.splice(2000);
    }

    await writeJSON("audit_logs.json", logs);

    // Emit live socket event to all clients if socket.io is available
    const io = req?.app?.get("io");
    if (io) {
      io.emit("audit_log_created", entry);
    }

    return entry;
  } catch (err) {
    console.error("Failed to write audit log:", err);
  }
};

export const getAuditLogs = async (query: {
  search?: string;
  action?: string;
  serverId?: string;
  username?: string;
  page?: number | string;
  limit?: number | string;
}) => {
  const allLogs: AuditLogEntry[] = (await readJSON("audit_logs.json")) || [];
  
  let filtered = [...allLogs];

  if (query.action && query.action !== "ALL") {
    filtered = filtered.filter(l => l.action === query.action);
  }

  if (query.serverId && query.serverId !== "ALL") {
    filtered = filtered.filter(l => l.serverId === query.serverId);
  }

  if (query.username && query.username !== "ALL") {
    filtered = filtered.filter(l => l.username.toLowerCase() === query.username?.toLowerCase());
  }

  if (query.search && query.search.trim()) {
    const s = query.search.trim().toLowerCase();
    filtered = filtered.filter(l => 
      l.details.toLowerCase().includes(s) ||
      (l.serverName && l.serverName.toLowerCase().includes(s)) ||
      (l.serverId && l.serverId.toLowerCase().includes(s)) ||
      l.username.toLowerCase().includes(s) ||
      l.ip.toLowerCase().includes(s) ||
      l.action.toLowerCase().includes(s)
    );
  }

  const page = Math.max(1, parseInt(String(query.page || "1"), 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(String(query.limit || "25"), 10) || 25));
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedLogs = filtered.slice(startIndex, startIndex + limit);

  // Calculate summary counts
  const summary = {
    total: allLogs.length,
    starts: allLogs.filter(l => l.action === "SERVER_START").length,
    stops: allLogs.filter(l => l.action === "SERVER_STOP").length,
    restarts: allLogs.filter(l => l.action === "SERVER_RESTART").length,
    fileDeletions: allLogs.filter(l => l.action === "FILE_DELETE").length,
    serverDeletions: allLogs.filter(l => l.action === "SERVER_DELETE").length
  };

  return {
    logs: paginatedLogs,
    total,
    page,
    totalPages,
    limit,
    summary
  };
};

export const clearAuditLogs = async () => {
  await writeJSON("audit_logs.json", []);
  return true;
};
