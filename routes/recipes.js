const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const Product = require('../models/Product');

// GET all recipes
router.get('/', async (req, res) => {
    try {
        const recipes = await Recipe.find();
        res.json(recipes);
    } catch (err) {
        console.error("Fetch Recipes Error:", err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// GET recipe ingredients grouped by category
router.get('/:id/ingredients-by-category', async (req, res) => {
    try {
        const recipe = await Recipe.findOne({ id: Number(req.params.id) });
        if (!recipe) return res.status(404).json({ msg: 'Recipe not found' });

        const productIds = new Set();
        (recipe.ingredients || []).forEach(i => {
            if (i.productId) productIds.add(i.productId);
        });
        (recipe.sections || []).forEach(s => {
            (s.options || []).forEach(o => {
                if (o.productId) productIds.add(o.productId);
            });
        });

        const products = await Product.find({ id: { $in: Array.from(productIds) } });
        const productMap = new Map(products.map(p => [p.id, p]));

        // Group by category
        const categorized = {};

        // Helper to add to category
        const addToCategory = (product, fallbackInfo = {}) => {
            const cat = product ? (product.category || "Other") : "Other";
            if (!categorized[cat]) categorized[cat] = [];
            
            // If we have a product, use its data. Otherwise, use fallback info.
            if (product) {
                categorized[cat].push(product);
            } else if (fallbackInfo.name) {
                // Return a minimal object for unknown products
                categorized[cat].push({
                    id: fallbackInfo.productId || null,
                    name: fallbackInfo.name,
                    price: 0,
                    qty: fallbackInfo.quantity || "1",
                    image: 'assets/images/placeholder.jpg',
                    stock: 0,
                    isPlaceholder: true
                });
            }
        };

        // Combine products from ingredients and sections
        (recipe.ingredients || []).forEach(ing => {
            const p = productMap.get(ing.productId);
            addToCategory(p, ing);
        });

        (recipe.sections || []).forEach(sec => {
            (sec.options || []).forEach(opt => {
                const p = productMap.get(opt.productId);
                // Avoid duplicates if already added from ingredients
                if (p && categorized[p.category || "Other"]?.find(existing => existing.id === p.id)) return;
                addToCategory(p, opt);
            });
        });

        res.json({
            recipeName: recipe.name,
            categories: categorized
        });
    } catch (err) {
        console.error("Fetch Categorized Ingredients Error:", err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// GET recipes by cuisine
router.get('/cuisine/:cuisine', async (req, res) => {
    try {
        const recipes = await Recipe.find({ cuisine: req.params.cuisine });
        res.json(recipes);
    } catch (err) {
        console.error("Fetch Recipes by Cuisine Error:", err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

module.exports = router;