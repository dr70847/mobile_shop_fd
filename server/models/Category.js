const db = require("../config/db");

const Category = {
  getAll: (callback) => {
    db.query("SELECT id, name, slug, created_at FROM categories ORDER BY created_at DESC", callback);
  },
  getById: (id, callback) => {
    db.query("SELECT id, name, slug, created_at FROM categories WHERE id = ? LIMIT 1", [id], callback);
  },
  create: ({ name, slug }, callback) => {
    db.query("INSERT INTO categories (name, slug) VALUES (?, ?)", [name, slug], callback);
  },
  update: (id, { name, slug }, callback) => {
    db.query("UPDATE categories SET name = ?, slug = ? WHERE id = ?", [name, slug, id], callback);
  },
  delete: (id, callback) => {
    db.query("DELETE FROM categories WHERE id = ?", [id], callback);
  },
};

module.exports = Category;
