const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');

async function removeRecipes() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/grosync');
        console.log("Connected to MongoDB");

        const idsToRemove = [51, 52, 53, 54, 55, 4017, 4018, 4019];
        
        const result = await Recipe.deleteMany({ id: { $in: idsToRemove } });
        console.log(`Successfully deleted ${result.deletedCount} recipes.`);

        // Final Italian recipe check
        const finalCount = await Recipe.countDocuments({ cuisine: "Italian" });
        console.log(`Current Italian recipe count: ${finalCount}`);

    } catch (err) {
        console.error("Removal error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

removeRecipes();
