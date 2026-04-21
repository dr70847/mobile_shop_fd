const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { ProductEntity } = require('../domain/entities');

const adminChain = [requireAuth, requireAdmin];
const apiVersionPath = "/api/v1/products";

function rootUrl(req) {
    return `${req.protocol}://${req.get("host")}`;
}

function withLinks(req, product) {
    return {
        ...product,
        _links: {
            self: { href: `${rootUrl(req)}${apiVersionPath}/${product.id}` },
            collection: { href: `${rootUrl(req)}${apiVersionPath}` },
        },
    };
}

router.post('/', ...adminChain, (req, res) => {
    const entity = new ProductEntity({
        name: req.body?.name,
        description: req.body?.description,
        price: req.body?.price,
        stock: req.body?.stock,
    });
    try {
        entity.validatePricing();
    } catch (validationErr) {
        return res.status(400).json({ message: validationErr.message });
    }

    Product.create(
        {
            name: entity.name,
            description: entity.description,
            price: entity.price,
            stock: entity.stock,
        },
        (err, result) => {
            if (err) {
                console.error('products POST:', err.code || err.message);
                return res.status(500).json({ message: 'Database error.' });
            }
            Product.getById(result.insertId, (err2, rows) => {
                if (err2 || !rows || !rows[0]) {
                    return res.status(201).json({ id: result.insertId });
                }
                return res.status(201).json(withLinks(req, rows[0]));
            });
        }
    );
});

router.put('/:id', ...adminChain, (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id) || id <= 0) {
        return res.status(400).json({ message: 'Invalid product id.' });
    }
    const entity = new ProductEntity({
        id,
        name: req.body?.name,
        description: req.body?.description,
        price: req.body?.price,
        stock: req.body?.stock,
    });
    try {
        entity.validatePricing();
    } catch (validationErr) {
        return res.status(400).json({ message: validationErr.message });
    }

    Product.update(
        id,
        {
            name: entity.name,
            description: entity.description,
            price: entity.price,
            stock: entity.stock,
        },
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
                return res.json(withLinks(req, rows[0]));
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
        res.json({
            items: results.map((product) => withLinks(req, product)),
            _links: {
                self: { href: `${rootUrl(req)}${apiVersionPath}` },
            },
        });
    });
});

router.get('/:id', (req, res) => {
    Product.getById(req.params.id, (err, results) => {
        if (err) return res.status(500).json(err);
        if (!results || !results[0]) {
            return res.status(404).json({ message: "Product not found." });
        }
        res.json(withLinks(req, results[0]));
    });
});

module.exports = router;
