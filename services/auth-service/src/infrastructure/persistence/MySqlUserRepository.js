const db = require("../../integration/db");

function createMySqlUserRepository() {
  return {
    findByEmail(email) {
      return new Promise((resolve, reject) => {
        db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email], (err, rows) => {
          if (err) return reject(err);
          const row = rows[0] || null;
          if (!row) return resolve(null);

          // Normalize to a stable shape for application/domain.
          resolve({
            id: row.id,
            name: row.NAME ?? row.name ?? "",
            email: row.email,
            is_admin: row.is_admin,
            password_hash: row.PASSWORD ?? row.password_hash ?? "",
          });
        });
      });
    },

    findById(id) {
      return new Promise((resolve, reject) => {
        db.query(
          "SELECT id, NAME AS name, email, is_admin, created_at FROM users WHERE id = ? LIMIT 1",
          [id],
          (err, rows) => {
            if (err) return reject(err);
            resolve(rows[0] || null);
          }
        );
      });
    },

    create({ name, email, passwordHash }) {
      return new Promise((resolve, reject) => {
        db.query(
          "INSERT INTO users (NAME, email, PASSWORD) VALUES (?, ?, ?)",
          [name, email, passwordHash],
          (err, result) => {
            if (err) return reject(err);
            resolve({ id: result.insertId });
          }
        );
      });
    },
  };
}

module.exports = { createMySqlUserRepository };

