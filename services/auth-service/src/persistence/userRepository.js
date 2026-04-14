const db = require("../integration/db");

function findByEmail(email) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM users WHERE email = ? LIMIT 1", [email], (err, rows) => {
      if (err) return reject(err);
      resolve(rows[0] || null);
    });
  });
}

function findById(id) {
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
}

function create({ name, email, passwordHash }) {
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
}

module.exports = { findByEmail, findById, create };
