const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');

router.get('/', (req, res) => {
    Order.getAll((err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

router.get('/my', requireAuth, (req, res) => {
    Order.getByUserId(req.user.id, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

router.post('/checkout', requireAuth, (req, res) => {
    const items = Array.isArray(req.body?.items) ? req.body.items : [];
    if (items.length === 0) {
        return res.status(400).json({ message: 'Cart is empty.' });
    }

    const cleaned = items
        .map((it) => ({
            product_id: Number(it.product_id),
            quantity: Number(it.quantity),
        }))
        .filter((it) => Number.isFinite(it.product_id) && it.product_id > 0 && Number.isFinite(it.quantity) && it.quantity > 0);

    if (cleaned.length === 0) {
        return res.status(400).json({ message: 'Invalid cart items.' });
    }

    // Load product prices from DB to prevent tampering
    const ids = [...new Set(cleaned.map((it) => it.product_id))];
    Product.getByIds(ids, (err, rows) => {
        if (err) return res.status(500).json({ message: 'Database error.' });

        const priceById = new Map(rows.map((p) => [p.id, Number(p.price || 0)]));
        const orderItems = [];
        let totalPrice = 0;

        for (const it of cleaned) {
            if (!priceById.has(it.product_id)) {
                return res.status(400).json({ message: `Unknown product_id: ${it.product_id}` });
            }
            const unitPrice = priceById.get(it.product_id);
            totalPrice += unitPrice * it.quantity;
            orderItems.push({
                product_id: it.product_id,
                quantity: it.quantity,
                unit_price: unitPrice,
            });
        }

        Order.createWithItems(
            { userId: req.user.id, totalPrice: Number(totalPrice.toFixed(2)), status: 'NEW', items: orderItems },
            (err2, result) => {
                if (err2) return res.status(500).json({ message: 'Database error.' });
                res.json({ orderId: result.orderId });
            }
        );
    });
});

router.get('/user/:userId', (req, res) => {
    Order.getByUserId(req.params.userId, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

module.exports = router;