const AuditLog = require("../models/AuditLog");

function recordAudit(req, { action, targetType, targetId = null, metadata = {} }) {
  const actorUserId = req.user && req.user.id ? req.user.id : null;
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;
  const userAgent = req.headers["user-agent"] || null;

  AuditLog.create({ actorUserId, action, targetType, targetId, metadata, ipAddress, userAgent }, (err) => {
    if (err) {
      if (err.code === "ER_NO_SUCH_TABLE") return;
      console.error("audit/create:", err.code || err.message);
    }
  });
}

module.exports = { recordAudit };
