const db = require("../integration/db");

function getAll() {
  return new Promise((resolve, reject) => {
    db.query("SELECT id, NAME AS name, description, price, stock, created_at FROM products", (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function getById(id) {
  return new Promise((resolve, reject) => {
    db.query(
      "SELECT id, NAME AS name, description, price, stock, created_at FROM products WHERE id = ?",
      [id],
      (err, rows) => {
        if (err) return reject(err);
        resolve(rows[0] || null);
      }
    );
  });
}

function create({ name, description, price, stock }) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO products (NAME, description, price, stock) VALUES (?, ?, ?, ?)",
      [name, description, price, stock],
      (err, result) => {
        if (err) return reject(err);
        resolve({ id: result.insertId });
      }
    );
  });
}

function update(id, { name, description, price, stock }) {
  return new Promise((resolve, reject) => {
    db.query(
      "UPDATE products SET NAME = ?, description = ?, price = ?, stock = ? WHERE id = ?",
      [name, description, price, stock, id],
      (err, result) => {
        if (err) return reject(err);
        resolve(result.affectedRows > 0);
      }
    );
  });
}

function remove(id) {
  return new Promise((resolve, reject) => {
    db.query("DELETE FROM products WHERE id = ?", [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

module.exports = { getAll, getById, create, update, remove };
