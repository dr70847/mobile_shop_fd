const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { generateSecret, generateURI, verifySync } = require("otplib");
const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const UserActionToken = require("../models/UserActionToken");
const { sendEmail } = require("../services/emailService");
const { requireAuth } = require("../middleware/auth");
const { recordAudit } = require("../middleware/audit");
const { normalizeUserForRole } = require("../domain/entities");

const router = express.Router();

function parseDurationToSeconds(value, fallbackSeconds) {
  const raw = String(value || "").trim();
  if (!raw) return fallbackSeconds;
  if (/^\d+$/.test(raw)) return Number(raw);
  const m = raw.match(/^(\d+)\s*([smhd])$/i);
  if (!m) return fallbackSeconds;
  const n = Number(m[1]);
  const unit = m[2].toLowerCase();
  const mult = unit === "s" ? 1 : unit === "m" ? 60 : unit === "h" ? 3600 : 86400;
  return n * mult;
}

function baseUrl(req) {
  return `${req.protocol}://${req.get("host")}`;
}

function frontendBaseUrl() {
  return String(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/+$/, "");
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
    activate: { href: `${root}${req.baseUrl}/activate` },
    requestPasswordReset: { href: `${root}${req.baseUrl}/request-password-reset` },
    resetPassword: { href: `${root}${req.baseUrl}/reset-password` },
    changePassword: { href: `${root}${req.baseUrl}/change-password` },
  };
}

function isUserActive(userRow) {
  if (userRow && Object.prototype.hasOwnProperty.call(userRow, "is_active")) {
    return Boolean(userRow.is_active);
  }
  return true;
}

function issueActionToken({ userId, purpose, ttlMinutes }, callback) {
  const tokenValue = UserActionToken.generateTokenValue();
  const tokenHash = UserActionToken.hashToken(tokenValue);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  UserActionToken.revokeActiveForUserPurpose({ userId, purpose }, () => {
    UserActionToken.create({ userId, purpose, tokenHash, expiresAt }, (err) => {
      if (err) return callback(err);
      return callback(null, tokenValue);
    });
  });
}

async function sendActivationEmail(req, user) {
  const ttlMinutes = process.env.ACTIVATION_TOKEN_TTL_MINUTES ? Number(process.env.ACTIVATION_TOKEN_TTL_MINUTES) : 60 * 24;
  return new Promise((resolve, reject) => {
    issueActionToken({ userId: user.id, purpose: "activation", ttlMinutes }, async (err, tokenValue) => {
      if (err) return reject(err);
      const activationUrl = `${baseUrl(req)}${req.baseUrl}/activate?token=${encodeURIComponent(tokenValue)}`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Activate your MobileShop account",
          text: `Welcome ${user.name || ""}! Activate your account: ${activationUrl}`,
          html: `<p>Welcome ${user.name || ""}!</p><p>Activate your account: <a href="${activationUrl}">${activationUrl}</a></p>`,
        });
        return resolve();
      } catch (mailErr) {
        return reject(mailErr);
      }
    });
  });
}

async function sendPasswordResetEmail(req, user) {
  const ttlMinutes = process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES ? Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES) : 60;
  return new Promise((resolve, reject) => {
    issueActionToken({ userId: user.id, purpose: "password_reset", ttlMinutes }, async (err, tokenValue) => {
      if (err) return reject(err);
      const resetUrl = `${frontendBaseUrl()}/reset-password?token=${encodeURIComponent(tokenValue)}`;
      try {
        await sendEmail({
          to: user.email,
          subject: "Reset your MobileShop password",
          text: `Reset your password using this link: ${resetUrl}`,
          html: `<p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
        });
        return resolve();
      } catch (mailErr) {
        return reject(mailErr);
      }
    });
  });
}

function baseUserPayload(user) {
  const isAdmin = Boolean(user.is_admin);
  const roles = Array.isArray(user.roles) && user.roles.length > 0
    ? user.roles
    : isAdmin
      ? ["ROLE_ADMIN", "ROLE_USER"]
      : ["ROLE_USER"];
  return {
    id: user.id,
    email: user.email,
    name: user.name || "",
    is_admin: Boolean(user.is_admin),
    roles,
  };
}

function normalizeUserRow(userRow) {
  const isAdmin = Boolean(userRow.is_admin);
  return {
    id: userRow.id,
    name: userRow.name || userRow.NAME || "",
    email: userRow.email,
    is_admin: isAdmin,
    roles: isAdmin ? ["ROLE_ADMIN", "ROLE_USER"] : ["ROLE_USER"],
    two_factor_enabled: Boolean(userRow.two_factor_enabled),
  };
}

function signAccessToken(user) {
  const ttl = process.env.ACCESS_TOKEN_TTL || "15m";
  return jwt.sign(baseUserPayload(user), process.env.JWT_SECRET, { expiresIn: ttl });
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

function generateRefreshTokenValue() {
  // 48 bytes => 64 chars base64url-ish, good entropy for bearer token
  return crypto
    .randomBytes(48)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function issueTokens(user, cb) {
  const accessToken = signAccessToken(user);
  const refreshToken = generateRefreshTokenValue();
  const refreshTtlDays = process.env.REFRESH_TOKEN_TTL_DAYS ? Number(process.env.REFRESH_TOKEN_TTL_DAYS) : 30;
  const expiresAt = new Date(Date.now() + (Number.isFinite(refreshTtlDays) ? refreshTtlDays : 30) * 24 * 60 * 60 * 1000);
  const tokenHash = RefreshToken.sha256Hex(refreshToken);

  RefreshToken.create({ userId: user.id, tokenHash, expiresAt }, (err) => {
    if (err) {
      console.error("auth/tokens RefreshToken.create:", err.code || err.message);
      return cb(new Error("Failed to create session."));
    }
    const accessTtlSeconds = parseDurationToSeconds(process.env.ACCESS_TOKEN_TTL || "15m", 15 * 60);
    return cb(null, { accessToken, refreshToken, accessTtlSeconds });
  });
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
    if (!isUserActive(userRow)) return res.status(403).json({ message: "Account is not active. Check your email for activation link." });

    const user = normalizeUserRow(userRow);
    if (user.two_factor_enabled && userRow.two_factor_secret) {
      const challengeToken = signTwoFactorChallenge(user);
      if (responseShape === "oauth") {
        recordAudit(req, { action: "AUTH_LOGIN_2FA_CHALLENGE", targetType: "user", targetId: String(user.id) });
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

    return issueTokens(user, (issueErr, tokens) => {
      if (issueErr) return res.status(500).json({ message: issueErr.message });
      recordAudit(req, { action: "AUTH_LOGIN", targetType: "user", targetId: String(user.id) });
      if (responseShape === "oauth") {
        return res.json({
          access_token: tokens.accessToken,
          refresh_token: tokens.refreshToken,
          token_type: "Bearer",
          expires_in: tokens.accessTtlSeconds,
          user,
          _links: authLinks(req),
        });
      }
      // Backward-compatible: keep "token" as alias of access token
      return res.json({
        token: tokens.accessToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.accessTtlSeconds,
        user,
        _links: authLinks(req),
      });
    });
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
      User.create({ name, email, password_hash, isActive: 0 }, async (err2, result) => {
        if (err2) {
          console.error("auth/signup create:", err2.code || err2.message);
          return res.status(500).json({ message: "Database error." });
        }
        const user = { id: result.insertId, name, email, is_admin: false, is_active: false, roles: ["ROLE_USER"] };
        try {
          await sendActivationEmail(req, user);
        } catch (mailErr) {
          console.error("auth/signup activation email:", mailErr.message || mailErr);
        }
        recordAudit(req, { action: "AUTH_SIGNUP", targetType: "user", targetId: String(user.id), metadata: { email } });
        return res.status(201).json({
          message: "Account created. Please activate it from your email before login.",
          user,
          _links: authLinks(req),
        });
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
  if (grantType === "password") {
    return authenticateUser(
      req,
      res,
      {
        email: req.body?.username,
        password: req.body?.password,
      },
      "oauth"
    );
  }

  if (grantType === "refresh_token") {
    const refreshToken = String(req.body?.refresh_token || "");
    if (!refreshToken) {
      return res.status(400).json({ message: "refresh_token is required." });
    }
    const tokenHash = RefreshToken.sha256Hex(refreshToken);
    return RefreshToken.findValidByHash(tokenHash, (err, rows) => {
      if (err) {
        console.error("auth/oauth refresh findValidByHash:", err.code || err.message);
        return res.status(500).json({ message: "Database error." });
      }
      const row = rows && rows[0];
      if (!row) return res.status(401).json({ message: "Invalid or expired refresh token." });

      return User.findById(row.user_id, (err2, userRows) => {
        if (err2) return res.status(500).json({ message: "Database error." });
        const userRow = userRows && userRows[0];
        if (!userRow) return res.status(401).json({ message: "Invalid refresh token." });
        const user = normalizeUserRow(userRow);

        return RefreshToken.revokeByHash(tokenHash, (revokeErr) => {
          if (revokeErr) {
            console.error("auth/oauth refresh revoke:", revokeErr.code || revokeErr.message);
            return res.status(500).json({ message: "Database error." });
          }
          return issueTokens(user, (issueErr, tokens) => {
            if (issueErr) return res.status(500).json({ message: issueErr.message });
            return res.json({
              access_token: tokens.accessToken,
              refresh_token: tokens.refreshToken,
              token_type: "Bearer",
              expires_in: tokens.accessTtlSeconds,
              user,
              _links: authLinks(req),
            });
          });
        });
      });
    });
  }

  return res.status(400).json({ message: "Unsupported grant_type. Use password or refresh_token." });
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
    return issueTokens(user, (issueErr, tokens) => {
      if (issueErr) return res.status(500).json({ message: issueErr.message });
      recordAudit(req, { action: "AUTH_LOGIN_2FA_VERIFIED", targetType: "user", targetId: String(user.id) });
      return res.json({
        token: tokens.accessToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.accessTtlSeconds,
        user,
        _links: authLinks(req),
      });
    });
  });
});

router.post("/refresh", (req, res) => {
  const refreshToken = String(req.body?.refreshToken || req.body?.refresh_token || "");
  if (!refreshToken) {
    return res.status(400).json({ message: "refreshToken is required." });
  }
  const tokenHash = RefreshToken.sha256Hex(refreshToken);
  return RefreshToken.findValidByHash(tokenHash, (err, rows) => {
    if (err) {
      console.error("auth/refresh findValidByHash:", err.code || err.message);
      return res.status(500).json({ message: "Database error." });
    }
    const row = rows && rows[0];
    if (!row) return res.status(401).json({ message: "Invalid or expired refresh token." });

    return User.findById(row.user_id, (err2, userRows) => {
      if (err2) return res.status(500).json({ message: "Database error." });
      const userRow = userRows && userRows[0];
      if (!userRow) return res.status(401).json({ message: "Invalid refresh token." });
      const user = normalizeUserRow(userRow);

      return RefreshToken.revokeByHash(tokenHash, (revokeErr) => {
        if (revokeErr) {
          console.error("auth/refresh revoke:", revokeErr.code || revokeErr.message);
          return res.status(500).json({ message: "Database error." });
        }
        return issueTokens(user, (issueErr, tokens) => {
          if (issueErr) return res.status(500).json({ message: issueErr.message });
          return res.json({
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            expiresIn: tokens.accessTtlSeconds,
            _links: authLinks(req),
          });
        });
      });
    });
  });
});

router.post("/logout", (req, res) => {
  const refreshToken = String(req.body?.refreshToken || req.body?.refresh_token || "");
  if (!refreshToken) {
    return res.status(400).json({ message: "refreshToken is required." });
  }
  const tokenHash = RefreshToken.sha256Hex(refreshToken);
  return RefreshToken.revokeByHash(tokenHash, (err) => {
    if (err) {
      console.error("auth/logout revokeByHash:", err.code || err.message);
      return res.status(500).json({ message: "Database error." });
    }
    recordAudit(req, { action: "AUTH_LOGOUT", targetType: "session", targetId: tokenHash.slice(0, 12) });
    return res.json({ message: "Logged out." });
  });
});

router.post("/logout/all", requireAuth, (req, res) => {
  return RefreshToken.revokeAllForUser(req.user.id, (err) => {
    if (err) {
      console.error("auth/logout/all revokeAllForUser:", err.code || err.message);
      return res.status(500).json({ message: "Database error." });
    }
    recordAudit(req, { action: "AUTH_LOGOUT_ALL", targetType: "user", targetId: String(req.user.id) });
    return res.json({ message: "Logged out from all sessions." });
  });
});

router.get("/activate", (req, res) => {
  const token = String(req.query?.token || "");
  if (!token) return res.status(400).json({ message: "Activation token is required." });
  const tokenHash = UserActionToken.hashToken(token);
  return UserActionToken.findValidByHashAndPurpose({ tokenHash, purpose: "activation" }, (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    const actionToken = rows && rows[0];
    if (!actionToken) return res.status(400).json({ message: "Invalid or expired activation token." });
    return User.markEmailVerifiedAndActivate({ id: actionToken.user_id }, (uErr) => {
      if (uErr) return res.status(500).json({ message: "Database error." });
      return UserActionToken.consumeById(actionToken.id, () => {
        recordAudit(req, { action: "AUTH_ACTIVATE_ACCOUNT", targetType: "user", targetId: String(actionToken.user_id) });
        return res.json({ message: "Account activated. You can login now." });
      });
    });
  });
});

router.post("/request-password-reset", (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ message: "Email is required." });
  return User.findByEmail(email, async (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    const userRow = rows && rows[0];
    if (userRow) {
      try {
        await sendPasswordResetEmail(req, { id: userRow.id, email: userRow.email, name: userRow.NAME });
        recordAudit(req, { action: "AUTH_PASSWORD_RESET_REQUEST", targetType: "user", targetId: String(userRow.id) });
      } catch (mailErr) {
        console.error("auth/request-password-reset email:", mailErr.message || mailErr);
      }
    }
    return res.json({ message: "If this email exists, a reset link has been sent." });
  });
});

router.post("/reset-password", async (req, res) => {
  const token = String(req.body?.token || "");
  const newPassword = String(req.body?.newPassword || "");
  if (!token || !newPassword) return res.status(400).json({ message: "Token and newPassword are required." });
  if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });
  const tokenHash = UserActionToken.hashToken(token);
  return UserActionToken.findValidByHashAndPurpose({ tokenHash, purpose: "password_reset" }, async (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    const actionToken = rows && rows[0];
    if (!actionToken) return res.status(400).json({ message: "Invalid or expired reset token." });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return User.updatePasswordHash({ id: actionToken.user_id, passwordHash }, (uErr) => {
      if (uErr) return res.status(500).json({ message: "Database error." });
      return UserActionToken.consumeById(actionToken.id, () => {
        recordAudit(req, { action: "AUTH_PASSWORD_RESET_COMPLETE", targetType: "user", targetId: String(actionToken.user_id) });
        return res.json({ message: "Password reset successful." });
      });
    });
  });
});

router.post("/change-password", requireAuth, (req, res) => {
  const currentPassword = String(req.body?.currentPassword || "");
  const newPassword = String(req.body?.newPassword || "");
  if (!currentPassword || !newPassword) return res.status(400).json({ message: "currentPassword and newPassword are required." });
  if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters." });

  return User.findByIdWithSecrets(req.user.id, async (err, rows) => {
    if (err) return res.status(500).json({ message: "Database error." });
    const userRow = rows && rows[0];
    if (!userRow) return res.status(404).json({ message: "User not found." });
    const matches = await bcrypt.compare(currentPassword, userRow.PASSWORD || "");
    if (!matches) return res.status(401).json({ message: "Current password is incorrect." });
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return User.updatePasswordHash({ id: req.user.id, passwordHash }, (uErr) => {
      if (uErr) return res.status(500).json({ message: "Database error." });
      recordAudit(req, { action: "AUTH_PASSWORD_CHANGE", targetType: "user", targetId: String(req.user.id) });
      return res.json({ message: "Password changed successfully." });
    });
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

