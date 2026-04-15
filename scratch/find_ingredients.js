const mongoose = require('mongoose');
const Product = require('../models/Product');

async function findIngredients() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/grosync');
        const ingredientNames = [
            'tomato', 'garlic', 'onion', 'pasta', 'carrot', 'capsicum', 'broccoli', 
            'milk', 'flour', 'mushroom', 'spinach', 'potato', 'coriander', 
            'bread', 'butter', 'rice', 'peas', 'cauliflower', 'lemon', 
            'apple', 'banana', 'grapes', 'strawberry', 'vegetables', 'roti', 'flatbread'
        ];
        
        const query = ingredientNames.map(name => new RegExp(name, 'i'));
        const products = await Product.find({ name: { $in: query } });
        
        console.log(JSON.stringify(products.map(p => ({id: p.id, name: p.name, category: p.category})), null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

findIngredients();
