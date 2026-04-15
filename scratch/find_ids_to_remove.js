const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

async function findIds() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/grosync');
        const names = [
            'Penne Arrabbiata', 
            'Classic Margherita Pizza', 
            'Mushroom Risotto', 
            'Spaghetti Aglio e Olio', 
            'Pasta Primavera', 
            'Pasta Alfredo', 
            'Veggie Lasagna', 
            'Minestrone Soup'
        ];
        const rs = await Recipe.find({ name: { $in: names } });
        console.log("Found " + rs.length + " recipes matching the images.");
        console.log(JSON.stringify(rs.map(r => ({id: r.id, name: r.name, cuisine: r.cuisine})), null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

findIds();
