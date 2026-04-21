const db = require("../config/db");

const Shipment = {
  getAll: (callback) => {
    db.query(
      "SELECT id, order_id, tracking_number, carrier, STATUS AS status, created_at FROM shipments ORDER BY created_at DESC",
      callback
    );
  },
  getById: (id, callback) => {
    db.query(
      "SELECT id, order_id, tracking_number, carrier, STATUS AS status, created_at FROM shipments WHERE id = ? LIMIT 1",
      [id],
      callback
    );
  },
  create: ({ orderId, trackingNumber, carrier, status = "PENDING" }, callback) => {
    db.query(
      "INSERT INTO shipments (order_id, tracking_number, carrier, STATUS) VALUES (?, ?, ?, ?)",
      [orderId, trackingNumber || null, carrier || null, status],
      callback
    );
  },
  updateStatus: (id, status, callback) => {
    db.query("UPDATE shipments SET STATUS = ? WHERE id = ?", [status, id], callback);
  },
};

module.exports = Shipment;
