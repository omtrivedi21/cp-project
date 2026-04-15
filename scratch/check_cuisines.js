const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

async function checkCuisines() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/grosync');
        const stats = await Recipe.aggregate([
            { $group: { _id: '$cuisine', count: { $sum: 1 } } }
        ]);
        console.log(JSON.stringify(stats, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkCuisines();
