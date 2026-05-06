const db = require('../config/db');

const Product = {
    getAll: (callback) => {
        db.query(
            'SELECT id, NAME AS name, description, price, stock, image_url, created_at FROM products',
            callback
        );
    },
    getById: (id, callback) => {
        db.query(
            'SELECT id, NAME AS name, description, price, stock, image_url, created_at FROM products WHERE id = ?',
            [id],
            callback
        );
    },
    getByIds: (ids, callback) => {
        if (!ids || ids.length === 0) return callback(null, []);
        db.query(
            'SELECT id, NAME AS name, description, price, stock, image_url, created_at FROM products WHERE id IN (?)',
            [ids],
            callback
        );
    },
    create: ({ name, description, price, stock, image_url }, callback) => {
        db.query(
            'INSERT INTO products (NAME, description, price, stock, image_url) VALUES (?, ?, ?, ?, ?)',
            [name, description || '', Number(price), Number(stock) || 0, image_url || null],
            callback
        );
    },
    update: (id, { name, description, price, stock, image_url }, callback) => {
        db.query(
            'UPDATE products SET NAME = ?, description = ?, price = ?, stock = ?, image_url = ? WHERE id = ?',
            [name, description || '', Number(price), Number(stock) || 0, image_url || null, id],
            callback
        );
    },
    delete: (id, callback) => {
        db.query('DELETE FROM products WHERE id = ?', [id], callback);
    },
};

module.exports = Product;