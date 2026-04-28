const db = require("../config/db");

function isBadFieldError(err) {
  return err && (err.code === "ER_BAD_FIELD_ERROR" || /unknown column/i.test(String(err.message || "")));
}

const User = {
  create: ({ name, email, password_hash }, callback) => {
    db.query(
      "INSERT INTO users (NAME, email, PASSWORD) VALUES (?, ?, ?)",
      [name, email, password_hash],
      callback
    );
  },

  findByEmail: (email, callback) => {
    db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email], callback);
  },

  findById: (id, callback) => {
    db.query(
      "SELECT id, NAME AS name, email, is_admin, created_at, two_factor_enabled FROM users WHERE id = ? LIMIT 1",
      [id],
      (err, rows) => {
        if (!err) return callback(null, rows);
        if (!isBadFieldError(err)) return callback(err);

        // Backward-compatible for databases not yet migrated with 2FA columns
        return db.query(
          "SELECT id, NAME AS name, email, is_admin, created_at FROM users WHERE id = ? LIMIT 1",
          [id],
          (err2, rows2) => {
            if (err2) return callback(err2);
            const row = rows2 && rows2[0];
            if (!row) return callback(null, rows2);
            row.two_factor_enabled = 0;
            return callback(null, [row]);
          }
        );
      }
    );
  },

  findByIdWithSecrets: (id, callback) => {
    db.query(
      `SELECT id, NAME, email, is_admin, created_at, two_factor_enabled, two_factor_secret, two_factor_temp_secret
       FROM users
       WHERE id = ? LIMIT 1`,
      [id],
      (err, rows) => {
        if (!err) return callback(null, rows);
        if (!isBadFieldError(err)) return callback(err);

        // Backward-compatible for databases not yet migrated with 2FA columns
        return db.query(
          "SELECT id, NAME, email, is_admin, created_at FROM users WHERE id = ? LIMIT 1",
          [id],
          (err2, rows2) => {
            if (err2) return callback(err2);
            const row = rows2 && rows2[0];
            if (!row) return callback(null, rows2);
            row.two_factor_enabled = 0;
            row.two_factor_secret = null;
            row.two_factor_temp_secret = null;
            return callback(null, [row]);
          }
        );
      }
    );
  },

  getAll: (callback) => {
    db.query(
      "SELECT id, NAME AS name, email, is_admin, created_at FROM users ORDER BY created_at DESC",
      callback
    );
  },

  setAdminRole: (id, isAdmin, callback) => {
    db.query("UPDATE users SET is_admin = ? WHERE id = ?", [isAdmin ? 1 : 0, id], callback);
  },

  saveTwoFactorSetup: (id, secret, callback) => {
    db.query(
      "UPDATE users SET two_factor_temp_secret = ?, two_factor_enabled = 0 WHERE id = ?",
      [secret, id],
      callback
    );
  },

  enableTwoFactor: (id, secret, callback) => {
    db.query(
      "UPDATE users SET two_factor_secret = ?, two_factor_temp_secret = NULL, two_factor_enabled = 1 WHERE id = ?",
      [secret, id],
      callback
    );
  },

  disableTwoFactor: (id, callback) => {
    db.query(
      "UPDATE users SET two_factor_secret = NULL, two_factor_temp_secret = NULL, two_factor_enabled = 0 WHERE id = ?",
      [id],
      callback
    );
  },
};

module.exports = User;

