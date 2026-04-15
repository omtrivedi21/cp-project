const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        console.log("Removing preferences field from all users in the database...");
        const result = await mongoose.connection.collection('users').updateMany(
            {},
            { $unset: { preferences: "" } }
        );
        console.log(`Successfully updated ${result.modifiedCount} user documents.`);
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
