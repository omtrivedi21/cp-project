const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        console.log("Removing storeSource and carbonFootprint fields from all products...");
        const result = await mongoose.connection.collection('products').updateMany(
            {},
            { $unset: { storeSource: "", carbonFootprint: "" } }
        );
        console.log(`Successfully updated ${result.modifiedCount} product documents.`);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
