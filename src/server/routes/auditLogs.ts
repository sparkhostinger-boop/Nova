import express from "express";
import { requireAdmin } from "../middleware/auth.js";
import { getAuditLogs, clearAuditLogs } from "../services/auditLogger.js";

const router = express.Router();

// Visible and accessible only to administrators
router.use(requireAdmin);

router.get("/", async (req, res) => {
  try {
    const { search, action, serverId, username, page, limit } = req.query;
    const result = await getAuditLogs({
      search: search as string,
      action: action as string,
      serverId: serverId as string,
      username: username as string,
      page: page as string,
      limit: limit as string
    });
    res.json(result);
  } catch (err: any) {
    console.error("Error fetching audit logs:", err);
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

router.delete("/", async (req, res) => {
  try {
    await clearAuditLogs();
    res.json({ success: true, message: "Audit logs cleared successfully" });
  } catch (err: any) {
    console.error("Error clearing audit logs:", err);
    res.status(500).json({ error: "Failed to clear audit logs" });
  }
});

router.get("/export", async (req, res) => {
  try {
    const { readJSON } = await import("../services/db.js");
    const logs = (await readJSON("audit_logs.json")) || [];
    res.setHeader("Content-Disposition", `attachment; filename=nova_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(logs, null, 2));
  } catch (err: any) {
    console.error("Error exporting audit logs:", err);
    res.status(500).json({ error: "Failed to export audit logs" });
  }
});

export default router;
