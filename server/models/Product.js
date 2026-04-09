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
    },
    create: ({ name, description, price, stock }, callback) => {
        db.query(
            'INSERT INTO products (NAME, description, price, stock) VALUES (?, ?, ?, ?)',
            [name, description || '', Number(price), Number(stock) || 0],
            callback
        );
    },
    update: (id, { name, description, price, stock }, callback) => {
        db.query(
            'UPDATE products SET NAME = ?, description = ?, price = ?, stock = ? WHERE id = ?',
            [name, description || '', Number(price), Number(stock) || 0, id],
            callback
        );
    },
    delete: (id, callback) => {
        db.query('DELETE FROM products WHERE id = ?', [id], callback);
    },
};

module.exports = Product;