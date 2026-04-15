const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/grosync').then(async () => {
    try {
        console.log("Reordering fields in MongoDB (moving phone after name)...");
        const collection = mongoose.connection.collection('users');
        const users = await collection.find({}).toArray();

        for (const u of users) {
            const orgId = u._id;
            // Create a new object to control key order
            const newDoc = {
                _id: u._id,
                name: u.name,
                phone: u.phone,
                email: u.email,
                password: u.password,
                orderHistory: u.orderHistory,
                role: u.role,
                savedAddresses: u.savedAddresses,
                savedCart: u.savedCart,
                createdAt: u.createdAt,
                lastLogin: u.lastLogin
            };

            // Note: We don't include preferences as the user asked to remove them

            await collection.replaceOne({ _id: orgId }, newDoc);
        }
        console.log("Success! Documents reordered.");
    } catch (err) {
        console.error(err);
    }
    process.exit(0);
});
