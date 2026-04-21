const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth } = require("../middleware/auth");
const { normalizeUserForRole } = require("../domain/entities");

const router = express.Router();

function baseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function authLinks(req) {
  const root = baseUrl(req);
  return {
    self: { href: `${root}${req.originalUrl}` },
    login: { href: `${root}${req.baseUrl}/login` },
    signup: { href: `${root}${req.baseUrl}/signup` },
    me: { href: `${root}${req.baseUrl}/me` },
    token: { href: `${root}${req.baseUrl}/oauth/token` },
  };
}

function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name || "",
      is_admin: Boolean(user.is_admin),
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function authenticateUser(req, res, credentials, responseShape = "jwt") {
  const email = String(credentials?.email || "").trim().toLowerCase();
  const password = String(credentials?.password || "");
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  return User.findByEmail(email, async (err, rows) => {
    if (err) {
      console.error("auth/login findByEmail:", err.code || err.message);
      return res.status(500).json({ message: "Database error." });
    }
    const userRow = rows && rows[0];
    if (!userRow) return res.status(401).json({ message: "Invalid email or password." });

    const ok = await bcrypt.compare(password, userRow.PASSWORD || "");
    if (!ok) return res.status(401).json({ message: "Invalid email or password." });

    const user = {
      id: userRow.id,
      name: userRow.NAME,
      email: userRow.email,
      is_admin: Boolean(userRow.is_admin),
    };
    const token = signToken(user);
    if (responseShape === "oauth") {
      return res.json({
        access_token: token,
        token_type: "Bearer",
        expires_in: 7 * 24 * 60 * 60,
        user,
        _links: authLinks(req),
      });
    }
    return res.json({ token, user, _links: authLinks(req) });
  });
}

router.post("/signup", (req, res) => {
  const name = String(req.body?.name || "").trim();
  const email = String(req.body?.email || "").trim().toLowerCase();
  const password = String(req.body?.password || "");
  try {
    normalizeUserForRole({ name, email, isAdmin: false }).validateProfile();
    if (!password) {
      return res.status(400).json({ message: "Password is required." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }
  } catch (validationErr) {
    return res.status(400).json({ message: validationErr.message });
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
        const user = { id: result.insertId, name, email, is_admin: false };
        const token = signToken(user);
        return res.json({ token, user, _links: authLinks(req) });
      });
    } catch {
      return res.status(500).json({ message: "Failed to create account." });
    }
  });
});

router.post("/login", (req, res) => {
  return authenticateUser(req, res, req.body, "jwt");
});

router.post("/oauth/token", (req, res) => {
  const grantType = String(req.body?.grant_type || "").trim();
  if (grantType !== "password") {
    return res.status(400).json({ message: "Unsupported grant_type. Use password." });
  }

  return authenticateUser(
    req,
    res,
    {
    email: req.body?.username,
    password: req.body?.password,
    },
    "oauth"
  );
});

router.get("/me", requireAuth, (req, res) => {
  User.findById(req.user.id, (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    const user = rows && rows[0];
    if (!user) return res.status(404).json({ message: "User not found." });
    user.is_admin = Boolean(user.is_admin);
    return res.json({ user, _links: authLinks(req) });
  });
});

module.exports = router;

