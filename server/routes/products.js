const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const adminChain = [requireAuth, requireAdmin];

router.post('/', ...adminChain, (req, res) => {
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    const price = Number(req.body?.price);
    const stock = Number.parseInt(String(req.body?.stock ?? '0'), 10);

    if (!name) {
        return res.status(400).json({ message: 'Product name is required.' });
    }
    if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ message: 'Valid price is required.' });
    }

    Product.create(
        { name, description, price, stock: Number.isFinite(stock) ? Math.max(0, stock) : 0 },
        (err, result) => {
            if (err) {
                console.error('products POST:', err.code || err.message);
                return res.status(500).json({ message: 'Database error.' });
            }
            Product.getById(result.insertId, (err2, rows) => {
                if (err2 || !rows || !rows[0]) {
                    return res.status(201).json({ id: result.insertId });
                }
                return res.status(201).json(rows[0]);
            });
        }
    );
});

router.put('/:id', ...adminChain, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ message: 'Invalid product id.' });
    }
    const name = String(req.body?.name || '').trim();
    const description = String(req.body?.description || '').trim();
    const price = Number(req.body?.price);
    const stock = Number.parseInt(String(req.body?.stock ?? '0'), 10);

    if (!name) {
        return res.status(400).json({ message: 'Product name is required.' });
    }
    if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({ message: 'Valid price is required.' });
    }

    Product.update(
        id,
        { name, description, price, stock: Number.isFinite(stock) ? Math.max(0, stock) : 0 },
        (err, result) => {
            if (err) {
                console.error('products PUT:', err.code || err.message);
                return res.status(500).json({ message: 'Database error.' });
            }
            if (!result.affectedRows) {
                return res.status(404).json({ message: 'Product not found.' });
            }
            Product.getById(id, (err2, rows) => {
                if (err2 || !rows || !rows[0]) {
                    return res.status(200).json({ id });
                }
                return res.json(rows[0]);
            });
        }
    );
});

router.delete('/:id', ...adminChain, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ message: 'Invalid product id.' });
    }
    Product.delete(id, (err, result) => {
        if (err) {
            console.error('products DELETE:', err.code || err.message);
            if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.errno === 1451) {
                return res.status(409).json({
                    message: 'Cannot delete this product because it is linked to existing orders.',
                });
            }
            return res.status(500).json({ message: 'Database error.' });
        }
        if (!result.affectedRows) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        return res.status(204).send();
    });
});

router.get('/', (req, res) => {
    Product.getAll((err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

router.get('/:id', (req, res) => {
    Product.getById(req.params.id, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results[0]);
    });
});

module.exports = router;
