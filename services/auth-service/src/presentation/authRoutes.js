const express = require("express");
const authService = require("../business/authService");
const { requireAuth } = require("./authMiddleware");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
    return res.json(await authService.signup({ name, email, password }));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || "Database error." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }
    return res.json(await authService.login({ email, password }));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || "Database error." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    return res.json(await authService.me(req.user.id));
  } catch (err) {
    return res.status(err.status || 500).json({ message: err.message || "Database error." });
  }
});

module.exports = router;
