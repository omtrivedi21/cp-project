const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');

async function cleanRecipes() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grosync');
        console.log("Connected to MongoDB");

        const validCuisines = ["North Indian", "South Indian", "Gujarati", "Punjabi", "Italian"];

        // Delete recipes whose cuisine is NOT in the valid list
        const result = await Recipe.deleteMany({
            cuisine: { $nin: validCuisines }
        });

        console.log(`Deleted ${result.deletedCount} recipes from cuisines not shown on the website.`);
        
        // Final count by cuisine
        const stats = await Recipe.aggregate([
            { $group: { _id: '$cuisine', count: { $sum: 1 } } }
        ]);
        console.log("Current Database Statistics:");
        console.log(JSON.stringify(stats, null, 2));

    } catch (err) {
        console.error("Cleanup error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

cleanRecipes();
