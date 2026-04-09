const db = require("../config/db");

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
      "SELECT id, NAME AS name, email, is_admin, created_at FROM users WHERE id = ? LIMIT 1",
      [id],
      callback
    );
  },
};

module.exports = User;

