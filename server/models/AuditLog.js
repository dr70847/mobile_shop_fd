const db = require("../config/db");

const AuditLog = {
  create: ({ actorUserId = null, action, targetType, targetId = null, metadata = {}, ipAddress = null, userAgent = null }, callback) => {
    db.query(
      `INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, metadata_json, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        actorUserId,
        String(action || "").slice(0, 120),
        String(targetType || "").slice(0, 80),
        targetId,
        JSON.stringify(metadata || {}),
        ipAddress,
        userAgent,
      ],
      callback
    );
  },

  list: ({ limit = 100, offset = 0 }, callback) => {
    const safeLimit = Math.max(1, Math.min(200, Number(limit) || 100));
    const safeOffset = Math.max(0, Number(offset) || 0);
    db.query(
      `SELECT id, actor_user_id, action, target_type, target_id, metadata_json, ip_address, user_agent, created_at
       FROM audit_logs
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [safeLimit, safeOffset],
      callback
    );
  },
};

module.exports = AuditLog;
