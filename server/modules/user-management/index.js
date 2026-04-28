const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const { requireAuth, requireAdmin } = require("../../middleware/auth");
const AuditLog = require("../../models/AuditLog");
const { recordAudit } = require("../../middleware/audit");
const { observeModule } = require("../shared/moduleObservability");

const MODULE_NAME = "user-management";
const router = express.Router();

router.use(observeModule(MODULE_NAME));

router.get("/", requireAuth, requireAdmin, (req, res) => {
  User.getAll((err, users) => {
    if (err) {
      return res.status(500).json({ message: "Database error." });
    }
    return res.json({ items: users });
  });
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  const isAdmin = Boolean(req.body?.is_admin);
  const isActive = req.body?.is_active == null ? true : Boolean(req.body?.is_active);
  if (!name || !email || !password) {
    return res.status(400).json({ message: "name, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }
  return User.findByEmail(email, async (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (rows && rows[0]) return res.status(409).json({ message: "Email already exists." });
    const password_hash = await bcrypt.hash(password, 10);
    return User.create({ name, email, password_hash, isActive }, (err2, result) => {
      if (err2) return res.status(500).json({ message: "Database error." });
      const userId = result.insertId;
      User.setAdminRole(userId, isAdmin, () => {});
      recordAudit(req, {
        action: "USER_CREATE",
        targetType: "user",
        targetId: String(userId),
        metadata: { email, is_admin: isAdmin, is_active: isActive },
      });
      return res.status(201).json({ id: userId, name, email, is_admin: isAdmin, is_active: isActive });
    });
  });
});

router.get("/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid user id." });
  }

  if (!req.user.is_admin && Number(req.user.id) !== id) {
    return res.status(403).json({ message: "Forbidden." });
  }

  return User.findById(id, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: "Database error." });
    }
    const user = rows && rows[0];
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json({ user });
  });
});

router.patch("/:id/role", requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  const isAdmin = Boolean(req.body?.is_admin);

  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid user id." });
  }

  return User.setAdminRole(id, isAdmin, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Database error." });
    }
    if (!result.affectedRows) {
      return res.status(404).json({ message: "User not found." });
    }
    recordAudit(req, {
      action: "USER_ROLE_UPDATE",
      targetType: "user",
      targetId: String(id),
      metadata: { is_admin: isAdmin },
    });
    return res.json({ message: "Role updated.", is_admin: isAdmin });
  });
});

router.patch("/:id", requireAuth, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid user id." });
  }
  if (!req.user.is_admin && Number(req.user.id) !== id) {
    return res.status(403).json({ message: "Forbidden." });
  }
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const isActive = req.body?.is_active;
  if (!name || !email) return res.status(400).json({ message: "name and email are required." });

  return User.updateProfile({ id, name, email }, (err, result) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (!result.affectedRows) return res.status(404).json({ message: "User not found." });
    if (req.user.is_admin && typeof isActive !== "undefined") {
      return User.setActive({ id, isActive: Boolean(isActive) }, () => {
        recordAudit(req, { action: "USER_PROFILE_UPDATE", targetType: "user", targetId: String(id), metadata: { name, email, is_active: Boolean(isActive) } });
        return res.json({ message: "User updated." });
      });
    }
    recordAudit(req, { action: "USER_PROFILE_UPDATE", targetType: "user", targetId: String(id), metadata: { name, email } });
    return res.json({ message: "User updated." });
  });
});

router.delete("/:id", requireAuth, requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return res.status(400).json({ message: "Invalid user id." });
  }
  return User.deleteById(id, (err, result) => {
    if (err) return res.status(500).json({ message: "Database error." });
    if (!result.affectedRows) return res.status(404).json({ message: "User not found." });
    recordAudit(req, { action: "USER_DELETE", targetType: "user", targetId: String(id) });
    return res.json({ message: "User deleted." });
  });
});

router.get("/audit-logs", requireAuth, requireAdmin, (req, res) => {
  const limit = Number(req.query?.limit || 100);
  const offset = Number(req.query?.offset || 0);
  return AuditLog.list({ limit, offset }, (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    return res.json({ items: rows || [] });
  });
});

module.exports = {
  name: MODULE_NAME,
  basePath: "/api/v1/users",
  router,
  publicApi: [
    "GET /api/v1/users",
    "POST /api/v1/users",
    "GET /api/v1/users/:id",
    "PATCH /api/v1/users/:id",
    "DELETE /api/v1/users/:id",
    "PATCH /api/v1/users/:id/role",
    "GET /api/v1/users/audit-logs",
  ],
  docsPath: "/docs/modules/user-management",
};
