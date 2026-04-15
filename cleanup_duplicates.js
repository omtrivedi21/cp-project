const mongoose = require('mongoose');
const Recipe = require('./models/Recipe');

async function cleanup() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/grosync');
        console.log("Connected to MongoDB");

        // 1. Delete Variation Recipes (ending in (Var. X))
        const variationResult = await Recipe.deleteMany({ name: /\(Var\.\s*\d+\)/i });
        console.log(`Deleted ${variationResult.deletedCount} variation recipes.`);

        // 2. Delete Exact Duplicates (Keeping the one with the lowest ID)
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

        let duplicateDeletedCount = 0;
        for (const duplicate of exactDuplicates) {
            // Keep the first ID (lowest), delete the rest
            const idsToDelete = duplicate.ids.slice(1);
            const delRes = await Recipe.deleteMany({ id: { $in: idsToDelete } });
            duplicateDeletedCount += delRes.deletedCount;
            console.log(`Deleted ${delRes.deletedCount} duplicates for "${duplicate._id.name}" (${duplicate._id.cuisine})`);
        }

        console.log(`Total exact duplicates deleted: ${duplicateDeletedCount}`);
        console.log("Cleanup complete!");

    } catch (err) {
        console.error("Cleanup error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

cleanup();
