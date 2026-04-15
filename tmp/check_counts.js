const mongoose = require('mongoose');
const RecipeSchema = new mongoose.Schema({
    id: Number, name: String, cuisine: String, image: String, isCustomizable: Boolean,
    sections: Array, ingredients: Array
});
const Recipe = mongoose.model('Recipe', RecipeSchema);

async function check() {
    try {
        await mongoose.connect('mongodb://localhost:27017/grosync');
        console.log('--- Database Audit ---');

        const cuisines = await Recipe.aggregate([
            { $group: { _id: "$cuisine", count: { $sum: 1 } } }
        ]);

        console.log('CUISINE COUNTS:');
        cuisines.forEach(c => {
            console.log(`- ${c._id || 'UNSET'}: ${c.count}`);
        });

        const siCount = await Recipe.countDocuments({ cuisine: "South Indian" });
        console.log(`\nSouth Indian specific count: ${siCount}`);

        const siSamples = await Recipe.find({ cuisine: "South Indian" }).limit(5);
        console.log('South Indian samples:');
        siSamples.forEach(s => console.log(`  * ${s.name}`));

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
check();
