const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { generateSecret, generateURI, verifySync } = require("otplib");
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
    twoFactorSetup: { href: `${root}${req.baseUrl}/2fa/setup` },
    twoFactorEnable: { href: `${root}${req.baseUrl}/2fa/enable` },
    twoFactorDisable: { href: `${root}${req.baseUrl}/2fa/disable` },
    twoFactorVerifyLogin: { href: `${root}${req.baseUrl}/2fa/verify-login` },
  };
}

function baseUserPayload(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    is_admin: Boolean(user.is_admin),
  };
}

function normalizeUserRow(userRow) {
  return {
    id: userRow.id,
    name: userRow.name || userRow.NAME || "",
    email: userRow.email,
    is_admin: Boolean(userRow.is_admin),
    two_factor_enabled: Boolean(userRow.two_factor_enabled),
  };
}

function signToken(user) {
  return jwt.sign(
    baseUserPayload(user),
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function signTwoFactorChallenge(user) {
  return jwt.sign(
    {
      ...baseUserPayload(user),
      purpose: "2fa-login",
    },
    process.env.JWT_SECRET,
    { expiresIn: "10m" }
  );
}

function verifyTotpToken(code, secret) {
  const normalizedCode = String(code || "").replace(/\s+/g, "");
  if (!/^\d{6}$/.test(normalizedCode)) {
    return false;
  }
  const result = verifySync({
    secret,
    token: normalizedCode,
    epochTolerance: 30,
  });
  return Boolean(result?.valid);
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

    const user = normalizeUserRow(userRow);
    if (user.two_factor_enabled && userRow.two_factor_secret) {
      const challengeToken = signTwoFactorChallenge(user);
      if (responseShape === "oauth") {
        return res.status(202).json({
          requires_two_factor: true,
          two_factor_token: challengeToken,
          user,
          _links: authLinks(req),
        });
      }
      return res.status(202).json({
        requiresTwoFactor: true,
        twoFactorToken: challengeToken,
        user,
        _links: authLinks(req),
      });
    }

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

router.post("/2fa/verify-login", (req, res) => {
  const challengeToken = String(req.body?.twoFactorToken || "");
  const code = String(req.body?.code || "");

  if (!challengeToken || !code) {
    return res.status(400).json({ message: "Two-factor token and code are required." });
  }

  let payload;
  try {
    payload = jwt.verify(challengeToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired two-factor session." });
  }

  if (payload?.purpose !== "2fa-login" || !payload?.id) {
    return res.status(401).json({ message: "Invalid two-factor session." });
  }

  return User.findByIdWithSecrets(payload.id, (err, rows) => {
    if (err) {
      console.error("auth/2fa/verify-login findByIdWithSecrets:", err.code || err.message);
      return res.status(500).json({ message: "Database error." });
    }
    const userRow = rows && rows[0];
    if (!userRow || !userRow.two_factor_enabled || !userRow.two_factor_secret) {
      return res.status(400).json({ message: "Two-factor authentication is not active for this account." });
    }
    if (!verifyTotpToken(code, userRow.two_factor_secret)) {
      return res.status(401).json({ message: "Invalid authentication code." });
    }

    const user = normalizeUserRow(userRow);
    const token = signToken(user);
    return res.json({ token, user, _links: authLinks(req) });
  });
});

router.post("/2fa/setup", requireAuth, (req, res) => {
  return User.findById(req.user.id, (err, rows) => {
    if (err) {
      console.error("auth/2fa/setup findById:", err.code || err.message);
      return res.status(500).json({ message: "Database error." });
    }
    const userRow = rows && rows[0];
    if (!userRow) {
      return res.status(404).json({ message: "User not found." });
    }

    const secret = generateSecret();
    const accountEmail = userRow.email;
    const issuer = process.env.TOTP_APP_NAME || "MobileShop";
    const otpauthUrl = generateURI({
      issuer,
      label: accountEmail,
      secret,
    });

    return User.saveTwoFactorSetup(req.user.id, secret, (saveErr) => {
      if (saveErr) {
        console.error("auth/2fa/setup saveTwoFactorSetup:", saveErr.code || saveErr.message);
        return res.status(500).json({ message: "Database error." });
      }
      return res.json({
        secret,
        otpauthUrl,
        user: normalizeUserRow(userRow),
        _links: authLinks(req),
      });
    });
  });
});

router.post("/2fa/enable", requireAuth, (req, res) => {
  const code = String(req.body?.code || "");
  if (!code) {
    return res.status(400).json({ message: "Authentication code is required." });
  }

  return User.findByIdWithSecrets(req.user.id, (err, rows) => {
    if (err) {
      console.error("auth/2fa/enable findByIdWithSecrets:", err.code || err.message);
      return res.status(500).json({ message: "Database error." });
    }
    const userRow = rows && rows[0];
    if (!userRow) {
      return res.status(404).json({ message: "User not found." });
    }
    if (!userRow.two_factor_temp_secret) {
      return res.status(400).json({ message: "Start setup before enabling two-factor authentication." });
    }
    if (!verifyTotpToken(code, userRow.two_factor_temp_secret)) {
      return res.status(401).json({ message: "Invalid authentication code." });
    }

    return User.enableTwoFactor(req.user.id, userRow.two_factor_temp_secret, (saveErr) => {
      if (saveErr) {
        console.error("auth/2fa/enable enableTwoFactor:", saveErr.code || saveErr.message);
        return res.status(500).json({ message: "Database error." });
      }
      return res.json({ message: "Two-factor authentication enabled." });
    });
  });
});

router.post("/2fa/disable", requireAuth, (req, res) => {
  const code = String(req.body?.code || "");
  if (!code) {
    return res.status(400).json({ message: "Authentication code is required." });
  }

  return User.findByIdWithSecrets(req.user.id, (err, rows) => {
    if (err) {
      console.error("auth/2fa/disable findByIdWithSecrets:", err.code || err.message);
      return res.status(500).json({ message: "Database error." });
    }
    const userRow = rows && rows[0];
    if (!userRow) {
      return res.status(404).json({ message: "User not found." });
    }
    if (!userRow.two_factor_enabled || !userRow.two_factor_secret) {
      return res.status(400).json({ message: "Two-factor authentication is not enabled." });
    }
    if (!verifyTotpToken(code, userRow.two_factor_secret)) {
      return res.status(401).json({ message: "Invalid authentication code." });
    }

    return User.disableTwoFactor(req.user.id, (saveErr) => {
      if (saveErr) {
        console.error("auth/2fa/disable disableTwoFactor:", saveErr.code || saveErr.message);
        return res.status(500).json({ message: "Database error." });
      }
      return res.json({ message: "Two-factor authentication disabled." });
    });
  });
});

router.get("/me", requireAuth, (req, res) => {
  User.findById(req.user.id, (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    const user = rows && rows[0];
    if (!user) return res.status(404).json({ message: "User not found." });
    user.is_admin = Boolean(user.is_admin);
    user.two_factor_enabled = Boolean(user.two_factor_enabled);
    return res.json({ user, _links: authLinks(req) });
  });
});

module.exports = router;

