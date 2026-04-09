const db = require('../config/db');

const Product = {
    getAll: (callback) => {
        db.query(
            'SELECT id, NAME AS name, description, price, stock, created_at FROM products',
            callback
        );
    },
    getById: (id, callback) => {
        db.query(
            'SELECT id, NAME AS name, description, price, stock, created_at FROM products WHERE id = ?',
            [id],
            callback
        );
    },
    getByIds: (ids, callback) => {
        if (!ids || ids.length === 0) return callback(null, []);
        db.query(
            'SELECT id, NAME AS name, description, price, stock, created_at FROM products WHERE id IN (?)',
            [ids],
            callback
        );
    }
};

module.exports = Product;