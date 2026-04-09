const db = require('../config/db');

const Order = {
    getAll: (callback) => {
        db.query('SELECT * FROM orders', callback);
    },
    getByUserId: (userId, callback) => {
        db.query('SELECT * FROM orders WHERE user_id = ?', [userId], callback);
    },
    createWithItems: ({ userId, totalPrice, status, items }, callback) => {
        db.query(
            'INSERT INTO orders (user_id, total_price, STATUS) VALUES (?, ?, ?)',
            [userId, totalPrice, status],
            (err, result) => {
                if (err) return callback(err);
                const orderId = result.insertId;
                if (!items || items.length === 0) return callback(null, { orderId });

                const values = items.map((it) => [
                    orderId,
                    it.product_id,
                    it.quantity,
                    it.unit_price,
                ]);
                db.query(
                    'INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES ?',
                    [values],
                    (err2) => {
                        if (err2) return callback(err2);
                        callback(null, { orderId });
                    }
                );
            }
        );
    }
};

module.exports = Order;