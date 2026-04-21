const db = require("../config/db");

const Review = {
  getAllByProductId: (productId, callback) => {
    db.query(
      `SELECT id, user_id, product_id, rating, comment, created_at
       FROM reviews
       WHERE product_id = ?
       ORDER BY created_at DESC`,
      [productId],
      callback
    );
  },
  getById: (id, callback) => {
    db.query(
      "SELECT id, user_id, product_id, rating, comment, created_at FROM reviews WHERE id = ? LIMIT 1",
      [id],
      callback
    );
  },
  create: ({ userId, productId, rating, comment }, callback) => {
    db.query(
      "INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)",
      [userId, productId, rating, comment || null],
      callback
    );
  },
  update: (id, { rating, comment }, callback) => {
    db.query("UPDATE reviews SET rating = ?, comment = ? WHERE id = ?", [rating, comment || null, id], callback);
  },
  delete: (id, callback) => {
    db.query("DELETE FROM reviews WHERE id = ?", [id], callback);
  },
};

module.exports = Review;
