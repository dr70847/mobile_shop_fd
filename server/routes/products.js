const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

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