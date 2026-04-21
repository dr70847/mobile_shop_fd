const db = require("../config/db");

const Payment = {
  getAll: (callback) => {
    db.query(
      "SELECT id, order_id, payment_type, amount, STATUS AS status, provider_ref, created_at FROM payments ORDER BY created_at DESC",
      callback
    );
  },
  getById: (id, callback) => {
    db.query(
      "SELECT id, order_id, payment_type, amount, STATUS AS status, provider_ref, created_at FROM payments WHERE id = ? LIMIT 1",
      [id],
      callback
    );
  },
  create: ({ orderId, paymentType, amount, status = "PENDING", providerRef = null }, callback) => {
    db.query(
      "INSERT INTO payments (order_id, payment_type, amount, STATUS, provider_ref) VALUES (?, ?, ?, ?, ?)",
      [orderId, paymentType, amount, status, providerRef],
      callback
    );
  },
  updateStatus: (id, status, callback) => {
    db.query("UPDATE payments SET STATUS = ? WHERE id = ?", [status, id], callback);
  },
};

module.exports = Payment;
