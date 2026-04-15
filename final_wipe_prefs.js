const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        console.log("FORCE Removing preferences from all user documents...");
        const result = await mongoose.connection.collection('users').updateMany(
            {},
            { $unset: { preferences: "" } }
        );
        console.log(`Successfully removed property from ${result.modifiedCount} users.`);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
