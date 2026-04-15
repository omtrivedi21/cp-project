const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

async function analyzeDuplicates() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/grosync');
        
        // 1. Find Variation Recipes (ending in (Var. X))
        const variations = await Recipe.find({ name: /\(Var\.\s*\d+\)/i });
        
        // 2. Find Exact Duplicates (Name + Cuisine)
        const exactDuplicates = await Recipe.aggregate([
            {
                $group: {
                    _id: { name: '$name', cuisine: '$cuisine' },
                    count: { $sum: 1 },
                    ids: { $push: '$id' }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        console.log("=== Variation Recipes Found: " + variations.length + " ===");
        variations.forEach(v => console.log(`[Variation] ${v.cuisine}: ${v.name} (id: ${v.id})`));

        console.log("\n=== Exact Duplicates Found: " + exactDuplicates.length + " ===");
        exactDuplicates.forEach(d => {
            console.log(`[Duplicate] ${d._id.cuisine}: ${d._id.name} (ids: ${d.ids.join(', ')})`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

analyzeDuplicates();
