const db = require("../config/db");

function sha256Hex(input) {
  return require("crypto").createHash("sha256").update(String(input)).digest("hex");
}

const RefreshToken = {
  sha256Hex,

  create: ({ userId, tokenHash, expiresAt }, callback) => {
    db.query(
      "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)",
      [userId, tokenHash, expiresAt],
      callback
    );
  },

  findValidByHash: (tokenHash, callback) => {
    db.query(
      `SELECT id, user_id, token_hash, expires_at, revoked_at
       FROM refresh_tokens
       WHERE token_hash = ?
         AND revoked_at IS NULL
         AND expires_at > NOW()
       LIMIT 1`,
      [tokenHash],
      callback
    );
  },

  revokeByHash: (tokenHash, callback) => {
    db.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE token_hash = ? AND revoked_at IS NULL", [tokenHash], callback);
  },

  revokeAllForUser: (userId, callback) => {
    db.query("UPDATE refresh_tokens SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL", [userId], callback);
  },
};

module.exports = RefreshToken;

