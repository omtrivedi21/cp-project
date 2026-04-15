const mongoose = require('mongoose');
const Product = require('../models/Product');

async function mapIngredients() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/grosync');
        
        const ingredients = [
            'Tomato', 'Garlic', 'Onion', 'Pasta', 'Carrot', 'Capsicum', 'Broccoli', 
            'Milk', 'Flour', 'Mushroom', 'Spinach', 'Potato', 'Coriander', 
            'Bread', 'Butter', 'Rice', 'Peas', 'Cauliflower', 'Lemon', 
            'Apple', 'Banana', 'Grapes', 'Strawberry', 'Roti', 'Maida'
        ];
        
        const mapping = {};
        
        for (const name of ingredients) {
            // Find products matching the name
            const products = await Product.find({ 
                name: { $regex: name, $options: 'i' },
                category: { $in: ['Vegetables', 'Fruits', 'Dairy Products', 'Biscuits & Bakery', 'Atta, Rice & Dal', 'Oil, Ghee & Masala', 'Instant Food'] }
            });
            
            if (products.length > 0) {
                // Heuristic: shortest name or specific keyword match
                products.sort((a, b) => a.name.length - b.name.length);
                mapping[name.toLowerCase()] = {
                    id: products[0].id,
                    name: products[0].name
                };
            }
        }
        
        console.log(JSON.stringify(mapping, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

mapIngredients();
