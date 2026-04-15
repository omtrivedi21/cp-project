const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');
const Product = require('../models/Product');

async function checkRecipe() {
    try {
        await mongoose.connect('mongodb://localhost:27017/grosync');
        const recipe = await Recipe.findOne({ id: 1 });
        if (!recipe) {
            console.log("Recipe not found");
            process.exit(0);
        }
        console.log("Recipe Name:", recipe.name);
        console.log("Ingredients IDs:", recipe.ingredients.map(i => i.productId));
        console.log("Section Options IDs:", recipe.sections.map(s => s.options.map(o => o.productId)).flat());

        const allIds = [...recipe.ingredients.map(i => i.productId), ...recipe.sections.map(s => s.options.map(o => o.productId)).flat()];
        const products = await Product.find({ id: { $in: allIds } });
        console.log("Products found in DB:");
        products.forEach(p => {
            console.log(`- [${p.id}] ${p.name} (${p.category})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
checkRecipe();
