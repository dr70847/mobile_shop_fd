const db = require("../integration/db");

function getAll() {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM orders", (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function getByUserId(userId) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM orders WHERE user_id = ?", [userId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function createOrder({ userId, totalPrice, status }) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO orders (user_id, total_price, STATUS) VALUES (?, ?, ?)",
      [userId, totalPrice, status],
      (err, result) => {
        if (err) return reject(err);
        resolve({ id: result.insertId });
      }
    );
  });
}

function addOrderItems(items) {
  return new Promise((resolve, reject) => {
    db.query(
      "INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ?",
      [items],
      (err) => {
        if (err) return reject(err);
        resolve();
      }
    );
  });
}

function updateStatus(orderId, status) {
  return new Promise((resolve, reject) => {
    db.query("UPDATE orders SET STATUS = ? WHERE id = ?", [status, Number(orderId)], (err, result) => {
      if (err) return reject(err);
      resolve(result.affectedRows > 0);
    });
  });
}

module.exports = { getAll, getByUserId, createOrder, addOrderItems, updateStatus };
