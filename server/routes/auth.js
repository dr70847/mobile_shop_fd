const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name || "" },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

router.post("/signup", (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!name || !email || !password) {
    return res.status(400).json({ message: "Name, email, and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }

  User.findByEmail(email, async (err, rows) => {
    if (err) {
      console.error("auth/signup findByEmail:", err.code || err.message);
      return res.status(500).json({ message: "Database error." });
    }
    if (rows && rows.length > 0) {
      return res.status(409).json({ message: "Email is already registered." });
    }

    try {
      const password_hash = await bcrypt.hash(password, 10);
      User.create({ name, email, password_hash }, (err2, result) => {
        if (err2) {
          console.error("auth/signup create:", err2.code || err2.message);
          return res.status(500).json({ message: "Database error." });
        }
        const user = { id: result.insertId, name, email };
        const token = signToken(user);
        return res.json({ token, user });
      });
    } catch {
      return res.status(500).json({ message: "Failed to create account." });
    }
  });
});

router.post("/login", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  User.findByEmail(email, async (err, rows) => {
    if (err) {
      console.error("auth/login findByEmail:", err.code || err.message);
      return res.status(500).json({ message: "Database error." });
    }
    const userRow = rows && rows[0];
    if (!userRow) return res.status(401).json({ message: "Invalid email or password." });

    const ok = await bcrypt.compare(password, userRow.PASSWORD || "");
    if (!ok) return res.status(401).json({ message: "Invalid email or password." });

    const user = { id: userRow.id, name: userRow.NAME, email: userRow.email };
    const token = signToken(user);
    return res.json({ token, user });
  });
});

router.get("/me", requireAuth, (req, res) => {
  User.findById(req.user.id, (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    const user = rows && rows[0];
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.json({ user });
  });
});

module.exports = router;

