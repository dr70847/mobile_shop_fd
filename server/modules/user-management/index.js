const express = require("express");
const User = require("../../models/User");
const { requireAuth, requireAdmin } = require("../../middleware/auth");
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
    return res.json({ message: "Role updated.", is_admin: isAdmin });
  });
});

module.exports = {
  name: MODULE_NAME,
  basePath: "/api/v1/users",
  router,
  publicApi: [
    "GET /api/v1/users",
    "GET /api/v1/users/:id",
    "PATCH /api/v1/users/:id/role",
  ],
  docsPath: "/docs/modules/user-management",
};
