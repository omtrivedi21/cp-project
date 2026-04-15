const mongoose = require('mongoose');
const Recipe = require('../models/Recipe');

async function findDuplicates() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/grosync');
        const duplicates = await Recipe.aggregate([
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
        
        console.log("Found " + duplicates.length + " duplicate recipe groupings.");
        console.log(JSON.stringify(duplicates, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

findDuplicates();
