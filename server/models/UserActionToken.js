const crypto = require("crypto");
const db = require("../config/db");

function hashToken(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function generateTokenValue() {
  return crypto.randomBytes(32).toString("hex");
}

const UserActionToken = {
  hashToken,
  generateTokenValue,

  create: ({ userId, purpose, tokenHash, expiresAt }, callback) => {
    db.query(
      "INSERT INTO user_action_tokens (user_id, purpose, token_hash, expires_at) VALUES (?, ?, ?, ?)",
      [userId, purpose, tokenHash, expiresAt],
      callback
    );
  },

  findValidByHashAndPurpose: ({ tokenHash, purpose }, callback) => {
    db.query(
      `SELECT id, user_id, purpose, token_hash, expires_at, consumed_at
       FROM user_action_tokens
       WHERE token_hash = ?
         AND purpose = ?
         AND consumed_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash, purpose],
      callback
    );
  },

  consumeById: (id, callback) => {
    db.query("UPDATE user_action_tokens SET consumed_at = NOW() WHERE id = ? AND consumed_at IS NULL", [id], callback);
  },

  revokeActiveForUserPurpose: ({ userId, purpose }, callback) => {
    db.query(
      "UPDATE user_action_tokens SET consumed_at = NOW() WHERE user_id = ? AND purpose = ? AND consumed_at IS NULL",
      [userId, purpose],
      callback
    );
  },
};

module.exports = UserActionToken;
