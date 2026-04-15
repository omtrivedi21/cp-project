const mongoose = require('mongoose');
const Product = require('../models/Product');

async function getBaseProducts() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/grosync');
        const categories = ['Fruits & Vegetables', 'Dairy & Eggs', 'Atta, Rice & Dal', 'Foodgrains, Oil & Masala', 'Bakery, Cakes & Dairy'];
        const products = await Product.find({ category: { $in: categories } });
        
        // Filter to find the most likely base ingredients
        const targetNames = [
            'Tomato', 'Garlic', 'Onion', 'Pasta', 'Carrot', 'Capsicum', 'Broccoli', 
            'Milk', 'Flour', 'Mushroom', 'Spinach', 'Potato', 'Coriander', 
            'Bread', 'Butter', 'Rice', 'Peas', 'Cauliflower', 'Lemon', 
            'Apple', 'Banana', 'Grapes', 'Strawberry', 'Roti', 'Maida'
        ];
        
        const mapped = {};
        targetNames.forEach(name => {
            const matches = products.filter(p => p.name.toLowerCase().includes(name.toLowerCase()));
            if (matches.length > 0) {
                // Pick the shortest name as the most likely generic item
                matches.sort((a, b) => a.name.length - b.name.length);
                mapped[name] = { id: matches[0].id, name: matches[0].name };
            }
        });
        
        console.log(JSON.stringify(mapped, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

getBaseProducts();
