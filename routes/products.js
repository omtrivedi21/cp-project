const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../models/Product');

// GET all products
router.get('/', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// POST decrement stock
router.post('/decrement-stock', async (req, res) => {
    const { items } = req.body; // Array of { id, qty } or { _id, qty }
    try {
        for (const item of items) {
            const productId = item.id || item._id;
            const quantity = parseInt(item.qty || item.quantity || 0);

            if (!productId || quantity <= 0) continue;

            let query = {};
            if (mongoose.Types.ObjectId.isValid(productId)) {
                query = { _id: productId };
            } else if (!isNaN(productId)) {
                query = { id: Number(productId) };
            } else {
                continue;
            }

            const product = await Product.findOne(query);
            if (product) {
                product.stock = Math.max(0, (product.stock || 0) - quantity);
                await product.save();
                console.log(`📉 Stock Decremented: ${product.name} (-${quantity})`);
            }
        }
        res.json({ msg: 'Stock updated successfully' });
    } catch (err) {
        console.error("Stock Update Error:", err);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

module.exports = router;
