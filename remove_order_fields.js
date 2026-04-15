const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        console.log("Removing assignedStore and deliveryDistance fields from all orders...");
        const result = await mongoose.connection.collection('orders').updateMany(
            {},
            { $unset: { assignedStore: "", deliveryDistance: "" } }
        );
        console.log(`Successfully updated ${result.modifiedCount} order documents.`);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
